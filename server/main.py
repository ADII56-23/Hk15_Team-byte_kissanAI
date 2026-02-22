import os
import shutil
import tempfile
import json
from typing import Optional, List, Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy.orm import Session

from model import model
from decision_engine import engine
from llm_service import llm_service
from database import init_db, get_db, ChatMessage, FarmLog, WeeklyPlanner
from weather_service import weather_service
from services.sarvam_service import SarvamService
from services.satellite_service import satellite_service

import re

def strip_markdown(text):
    """
    Removes Markdown formatting (bold, italics, links, headers, bullet points) 
    to make text suitable for TTS.
    """
    # Remove bold/italics
    text = re.sub(r'(\*\*|__)(.*?)\1', r'\2', text)
    text = re.sub(r'(\*|_)(.*?)\1', r'\2', text)
    # Remove headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove links
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    # Remove bullet points
    text = re.sub(r'^\s*[\*\-\+]\s+', '', text, flags=re.MULTILINE)
    # Remove numbered lists
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)
    # Remove code blocks
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'`(.*?)`', r'\1', text)
    return text.strip()

load_dotenv()
init_db()

app = FastAPI(title="AI Farm Operations Copilot API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI Client (OpenRouter)
or_key = os.getenv("OPENROUTER_API_KEY")
print(f"OpenRouter Key Loaded: {or_key[:10]}...{or_key[-5:] if or_key else ''}")
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=or_key,
)

# Initialize Sarvam Service
sarvam_api_key = os.getenv("SARVAM_API_KEY")
print(f"Sarvam Key Loaded: {sarvam_api_key[:10]}...{sarvam_api_key[-5:] if sarvam_api_key else ''}")
sarvam = SarvamService(api_key=sarvam_api_key)

class FarmData(BaseModel):
    soil_moisture: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rain_probability: Optional[float] = None
    crop_type: Optional[str] = "Corn"
    plot_name: Optional[str] = "Main Field"
    field_size: Optional[float] = 10.0
    growth_stage: Optional[str] = "sowing"
    labor_available: Optional[int] = 5
    location: Optional[str] = "Ludhiana"
    available_equipments: Optional[List[str]] = []
    budget_constraints: Optional[str] = "Normal"
    language: Optional[str] = "English"

class CropValidationRequest(BaseModel):
    crop_name: str

class FarmAnalysisRequest(BaseModel):
    crop_type: str
    plot_name: Optional[str] = ""
    field_size: float
    location: str
    growth_stage: str
    labor_available: int
    available_equipments: Optional[List[str]] = []
    budget_constraints: Optional[str] = "Normal"
    language: Optional[str] = "English"

class SatelliteStatsRequest(BaseModel):
    geometry: Dict[str, Any]
    date_from: str
    date_to: str
    layer: Optional[str] = "NDVI"

class SatelliteImageRequest(BaseModel):
    geometry: Dict[str, Any]
    date: str
    layer: Optional[str] = "TRUE_COLOR"

@app.post("/satellite-image")
async def get_satellite_image(req: SatelliteImageRequest):
    img_data = await satellite_service.get_image(req.geometry, req.date, req.layer)
    if not img_data:
        raise HTTPException(status_code=500, detail="Failed to fetch image from Sentinel Hub")
    return Response(content=img_data, media_type="image/png")

@app.get("/")
async def root():
    return {"message": "AI Farm Operations Copilot API is running"}

@app.post("/validate-crop")
async def validate_crop(data: CropValidationRequest):
    """
    Uses OpenRouter LLM to verify if the provided crop name is a real, actual crop.
    Returns {"is_valid": bool, "message": str}
    """
    try:
        completion = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a botanical and agricultural expert. "
                        "Your only job is to determine if a given word or phrase is a real, recognized crop/plant that farmers can grow. "
                        "Respond ONLY with a JSON object with two fields: "
                        '"is_valid" (boolean: true if it is a real crop, false otherwise) and '
                        '"standard_name" (string: the proper English common name of the crop if valid, else empty string). '
                        "Examples of valid crops: wheat, rice, corn, tomato, potato, cotton, sugarcane, onion, mango, mustard, soybean, groundnut, turmeric. "
                        "Examples of INVALID inputs: 'xyz', 'abcd', 'diamond', 'car', 'hello', 'metal', randomly typed words. "
                        "Return ONLY raw JSON, no markdown."
                    )
                },
                {"role": "user", "content": f"Is this a real crop? '{data.crop_name}'"}
            ],
            response_format={"type": "json_object"},
            max_tokens=200
        )
        result_text = completion.choices[0].message.content
        try:
            import json as _json
            result = _json.loads(result_text)
            is_valid = bool(result.get("is_valid", False))
            standard_name = result.get("standard_name", data.crop_name)
            return {"is_valid": is_valid, "standard_name": standard_name if is_valid else ""}
        except Exception:
            return {"is_valid": False, "standard_name": ""}
    except Exception as e:
        print(f"Crop Validation Error: {e}")
        # On error, allow it through to not block the user
        return {"is_valid": True, "standard_name": data.crop_name}

@app.post("/farm-analysis")
async def farm_analysis(data: FarmAnalysisRequest):
    """
    Generates a rich, natural-language, location-aware agricultural analysis
    with day-wise 7-day action plan based on all input parameters.
    """
    try:
        # Fetch live weather for the location
        weather_context = ""
        weather_data = await weather_service.get_current_weather(q=data.location)
        if "error" not in weather_data:
            cur = weather_data.get("current", {})
            fcast = weather_data.get("forecast", {})
            weather_context = (
                f"Current weather at {data.location}: "
                f"Temperature {cur.get('temp')}°C, Humidity {cur.get('humidity')}%, "
                f"Wind {cur.get('wind_speed')} km/h. "
                f"7-day forecast temperatures: {fcast.get('weekly_max')}. "
                f"7-day forecast rainfall (mm): {fcast.get('weekly_rain')}."
            )

        equipments_str = ", ".join(data.available_equipments) if data.available_equipments else "None specified"

        lang_rule = (
            f"Respond ONLY in English using English (Latin) script."
            if data.language.lower() == "english"
            else f"Respond ONLY in {data.language}. You MUST write in the native script of {data.language} (e.g., Hindi: हिन्दी, Marathi: मराठी, Telugu: తెలుగు). DO NOT use English or transliterate into Latin characters."
        )

        prompt = f"""
You are an expert Indian agricultural scientist and farm operations advisor.

A farmer has provided the following farm details:
- Crop: {data.crop_type}
- Plot Name: {data.plot_name or 'Not specified'}
- Field Size: {data.field_size} acres
- Location: {data.location}
- Growth Stage: {data.growth_stage}
- Available Labor: {data.labor_available} workers
- Equipment: {equipments_str}
- Budget: {data.budget_constraints}
- Live Weather Data: {weather_context if weather_context else 'Not available — use general regional knowledge for this location.'}

LANGUAGE REQUIREMENT: {lang_rule}

Your task: Provide a comprehensive, insightful, friendly, natural language farm analysis in the requested language. Include:

1. **overview**: A 2-3 sentence overview of the current farm situation considering location, crop, stage and weather.
2. **viability_check**: A specific assessment of whether {data.crop_type} is suitable to grow in {data.location} given the current season and region. 
3. **time_period**: The typical duration (in weeks or months) for this crop from the current stage ({data.growth_stage}) to harvest.
4. **productivity_inputs**: A point-wise list of 4-5 specific inputs (fertilizers, treatments, organic additives) required to achieve MAXIMUM productivity for {data.crop_type} in this region.
5. **weather_impact**: How the current and forecasted weather specifically affects this crop at this growth stage in this region. Be specific to the location.
6. **key_insights**: 3-4 specific, actionable insights tailored to this crop, stage, location, labor, and equipment. Write each as a short paragraph.
7. **recommendations**: Top 3 specific recommendations the farmer should act on RIGHT NOW.
8. **risk_assessment**: Explain the main risks (pest, weather, soil, market) for this crop at this stage in this location.
9. **resource_plan**: How to best deploy {data.labor_available} workers and the available equipment ({equipments_str}) for maximum efficiency.
10. **day_wise_plan**: A 7-day action plan. For each day, provide:
    - day_number (1-7)
    - day_label (e.g., "Day 1 — Monday")
    - focus (the main focus area, in the requested language)
    - tasks (array of 2-3 specific task strings, in the requested language)
    - priority (MUST always be exactly one of: "High", "Medium", or "Low" in English — do NOT translate this field)
    - tips (a short, practical tip, in the requested language)
11. **confidence_note**: A short note on how confident you are in this advice.

Return ONLY raw JSON with keys: overview, viability_check, time_period, productivity_inputs (array of strings), weather_impact, key_insights (array of strings), recommendations (array of strings), risk_assessment, resource_plan, day_wise_plan (array of day objects), confidence_note.
"""

        completion = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[
                {"role": "system", "content": "You are a professional agricultural advisor providing location-specific, data-driven farm analysis. Respond only in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=4096
        )

        import json as _json
        result_text = completion.choices[0].message.content.strip()
        
        # Robust JSON cleaning
        if result_text.startswith("```"):
            # Multi-line split to handle ```json or just ```
            lines = result_text.splitlines()
            if lines[0].strip().startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            result_text = "\n".join(lines).strip()

        try:
            analysis = _json.loads(result_text)
            # Normalise priority values — must always be 'High', 'Medium', or 'Low'
            # (LLMs may translate them into other languages)
            priority_map = {
                'high': 'High', 'medium': 'Medium', 'low': 'Low',
                # Hindi
                'उच्च': 'High', 'मध्यम': 'Medium', 'कम': 'Low',
                # Telugu
                'అధిక': 'High', 'మధ్యమ': 'Medium', 'తక్కువ': 'Low',
                # Tamil
                'அதிக': 'High', 'நடுத்தர': 'Medium', 'குறைந்த': 'Low',
                # Kannada
                'ಹೆಚ್ಚು': 'High', 'ಮಧ್ಯಮ': 'Medium', 'ಕಡಿಮೆ': 'Low',
                # Odia
                'ଉଚ୍ଚ': 'High', 'ମଧ୍ୟ': 'Medium', 'ନ୍ୟୁନ': 'Low',
            }
            for day in analysis.get('day_wise_plan', []):
                raw_priority = str(day.get('priority', 'Medium'))
                day['priority'] = priority_map.get(raw_priority.lower(), priority_map.get(raw_priority, 'Medium'))
        except _json.JSONDecodeError as je:
            print(f"JSON Decode Error: {je}")
            print(f"Raw response was: {result_text[:500]}... [truncated]")
            # Attempt to fix common truncation issues or just fail gracefully
            raise HTTPException(status_code=500, detail=f"AI generated invalid JSON (possibly truncated). Error: {str(je)}")

        analysis["weather_raw"] = weather_data if "error" not in weather_data else None
        return analysis

    except Exception as e:
        print(f"Farm Analysis Error: {e}")
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        raise e

@app.post("/predict")
async def predict_operations(data: FarmData, db: Session = Depends(get_db)):
    # Log farm data to DB
    farm_log = FarmLog(
        soil_moisture=data.soil_moisture,
        temperature=data.temperature,
        humidity=data.humidity,
        rain_probability=data.rain_probability,
        crop_type=data.crop_type,
        labor_available=data.labor_available
    )
    db.add(farm_log)
    db.commit()

    # Handle missing data & confidence calculation
    missing_fields = []
    
    # If data is missing, attempt to fetch real-time ambient values
    if data.temperature is None or data.humidity is None:
        real_weather = await weather_service.get_current_weather(q=data.location)
        if "error" not in real_weather:
            if data.temperature is None: data.temperature = real_weather["current"]["temp"]
            if data.humidity is None: data.humidity = real_weather["current"]["humidity"]

    if data.soil_moisture is None: missing_fields.append("soil_moisture")
    if data.temperature is None: missing_fields.append("temperature")
    if data.humidity is None: missing_fields.append("humidity")
    if data.rain_probability is None: missing_fields.append("rain_probability")
    
    confidence_penalty = len(missing_fields) * 0.1
    base_confidence = 0.95
    final_confidence = max(base_confidence - confidence_penalty, 0.5)

    # Use defaults if data is missing
    prepared_data = {
        "soil_moisture": data.soil_moisture if data.soil_moisture is not None else 0.5,
        "temperature": data.temperature if data.temperature is not None else 25.0,
        "humidity": data.humidity if data.humidity is not None else 50.0,
        "rain_probability": data.rain_probability if data.rain_probability is not None else 0.1,
        "crop_type": data.crop_type or "Corn"
    }

    # 1. Predict Irrigation Urgency
    irrigation_result = model.predict(prepared_data)
    
    # 2. Prioritize Tasks
    tasks = engine.generate_prioritized_tasks(
        irrigation_score=irrigation_result["urgency_score"],
        rain_probability=prepared_data["rain_probability"],
        labor_available=data.labor_available or 5,
        growth_stage=data.growth_stage or "sowing",
        field_size=data.field_size or 10.0,
        equipments=data.available_equipments or []
    )

    # 3. Generate LLM Explanation
    explanation_result = llm_service.generate_explanation(
        farm_data=data.model_dump(),
        tasks=tasks,
        irrigation_prediction=irrigation_result,
        language=data.language
    )

    warning = None
    if missing_fields:
        warning = f"Low confidence due to incomplete data: Missing {', '.join(missing_fields)}"

    return {
        "tasks": explanation_result.get("dynamic_tasks", tasks),
        "irrigation_prediction": irrigation_result,
        "explanation": explanation_result.get("daily_action_plan", ""),
        "detailed_reasons": explanation_result.get("reasons", []),
        "resource_allocation": explanation_result.get("resource_allocation", ""),
        "performance_insight": explanation_result.get("performance_insight", ""),
        "risk_alert": explanation_result.get("risk_alert", ""),
        "confidence_score": final_confidence,
        "data_warning": warning
    }

# OpenAI client is already initialized globally at the top of the file.
# Removing duplicate initialization.

class KisaanQuery(BaseModel):
    query: str
    image: Optional[str] = None # base64 string
    language: Optional[str] = "English"
    location: Optional[str] = None
    mode: Optional[str] = "global"  # 'global' or 'expert'
    history: Optional[List[dict]] = []  # conversation history [{role, content}]

@app.post("/kisaan-ai")
async def kisaan_ai(data: KisaanQuery, db: Session = Depends(get_db)):
    try:
        # Save user query to DB
        db.add(ChatMessage(role="user", content=data.query))
        db.commit()

        # Fetch live weather context if location is available
        weather_context = ""
        if data.location:
            weather = await weather_service.get_current_weather(q=data.location)
            if "error" not in weather:
                weather_context = (
                    f"\n\nCURRENT WEATHER CONTEXT for {data.location}:\n"
                    f"- Temperature: {weather['current']['temp']}°C\n"
                    f"- Humidity: {weather['current']['humidity']}%\n"
                    f"- Wind Speed: {weather['current']['wind_speed']} km/h\n"
                    f"- Forecast Rain: {weather['forecast']['rain_sum']} mm\n"
                    f"- 7-Day Temp Trend: {weather['forecast']['weekly_max']}\n"
                    f"- 7-Day Rain Trend: {weather['forecast']['weekly_rain']}"
                )

        lang_rule = (
            f"Respond ONLY in English using English (Latin) script."
            if data.language.lower() == "english"
            else f"Respond ONLY in {data.language}. You MUST write in the native script of {data.language} (e.g., Hindi: हिन्दी, Telugu: తెలుగు, Tamil: தமிழ்). DO NOT use English or transliterate into Latin characters."
        )

        if data.mode == "expert":
            system_prompt = (
                f"You are Kisaan AI Expert, a first-class agricultural scientist. "
                f"ALLOWED CATEGORIES: Crops, Soil Health, Pests, Irrigation, Livestock, Agricultural Machines, and Regional Farming Geography/Climate. "
                f"STRICT REFUSAL: You MUST refuse non-agricultural topics like Mathematics (e.g., '2+2'), coding, history, or entertainment. "
                f"VISION ENGINE: Analyze agricultural photos (crops, soil, leaves, bugs, fruits, machinery). "
                f"PROTOCOL: "
                f"1. If an image is provided, confirm it is agricultural. "
                f"2. Provide expert analysis with sections: 'Identification', 'Health Assessment', 'Prevention', 'Recommended Medicines'. "
                f"Language Rule: {lang_rule}"
            )
        else:
            system_prompt = (
                f"You are FarmCopilot Agent. You are a specialist in Agriculture and Farming ONLY. "
                f"ACCEPTED TOPICS: Anything about farming, soil types (e.g. soil in Kashmir), weather for crops, irrigation, and crop care. "
                f"STRICT REFUSAL: Do NOT answer math (2+2), history, or general non-farming queries. Redirect them back to farming. "
                f"VISION ENGINE: Analyze farming images for issues. "
                f"LOCAL WEATHER DATA: {weather_context if weather_context else 'Not available.'} "
                f"Language Rule: {lang_rule}"
            )

        # Build message list with full conversation history for context
        messages = [{"role": "system", "content": system_prompt}]
        if data.history:
            for h in data.history[-10:]:  # Last 10 messages for context
                role = h.get("role")
                content = h.get("content")
                image = h.get("image")
                
                if role in ("user", "assistant"):
                    if image and role == "user":
                        # Include image in history message
                        msg_content = [{"type": "text", "text": content or "Analyze this image."}]
                        img_url = image
                        if not img_url.startswith("data:"):
                            img_url = f"data:image/jpeg;base64,{img_url}"
                        msg_content.append({
                            "type": "image_url",
                            "image_url": {"url": img_url}
                        })
                        messages.append({"role": role, "content": msg_content})
                    elif content:
                        messages.append({"role": role, "content": content})
        
        # Format the user message (handle text and optional image)
        user_content = []
        if data.query:
            user_content.append({"type": "text", "text": data.query})
        
        if data.image:
            # Handle both raw base64 and data URL formats
            img_url = data.image
            if not img_url.startswith("data:"):
                img_url = f"data:image/jpeg;base64,{img_url}"
            user_content.append({
                "type": "image_url",
                "image_url": {"url": img_url}
            })
        
        if not user_content:
            user_content.append({"type": "text", "text": "Please analyze this."})

        messages.append({"role": "user", "content": user_content})

        completion = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=messages,
            max_tokens=1000
        )
        response_text = completion.choices[0].message.content
        
        # Save assistant response to DB
        db.add(ChatMessage(role="assistant", content=response_text, category="Agricultural Expertise"))
        db.commit()

        return {
            "response": response_text,
            "specialist": "Dr. Kisaan AI",
            "category": "Agricultural Expertise"
        }
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "response": "I'm currently recalibrating my agricultural sensors. Please ask again in a moment.",
            "specialist": "System",
            "category": "Maintenance"
        }

@app.post("/kisaan-ai/voice")
async def kisaan_ai_voice(
    file: UploadFile = File(...), 
    location: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    lang_code: Optional[str] = Form("en-IN"),
    mode: Optional[str] = Form("expert"),
    history: Optional[str] = Form("[]"),  # JSON string of chat history
    db: Session = Depends(get_db)
):
    # Save the uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_path = tmp.name
    
    try:
        # Parse history
        try:
            history_list = json.loads(history or "[]")
        except Exception:
            history_list = []

        # 1. Speech to Text — use user's selected language as a hint for better accuracy
        transcript, detected_lang = sarvam.speech_to_text(temp_path, language_code=lang_code if lang_code and lang_code != "unknown" else "en-IN")
        
        if not transcript or "Could not transcribe" in transcript:
            return {"query": "", "response": "I'm sorry, I couldn't hear you clearly.", "audio": None}

        # 2. Process with existing Kisaan AI logic
        kisaan_query_data = KisaanQuery(
            query=transcript,
            language=language,
            location=location,
            mode=mode,
            history=history_list
        )
        
        ai_response = await kisaan_ai(kisaan_query_data, db)
        response_text = ai_response["response"]

        # 3. Text to Speech — use selected lang_code, fallback to auto-detected
        tts_lang = lang_code if lang_code and lang_code not in ("en-IN", "unknown") else detected_lang
        if tts_lang == "unknown":
            tts_lang = "en-IN"
            
        # Strip markdown for cleaner TTS
        clean_text = strip_markdown(response_text)
        print(f"Original Text Length: {len(response_text)} | Clean Text Length: {len(clean_text)}")
        
        audio_base64 = sarvam.text_to_speech(clean_text, language_code=tts_lang)
        
        if audio_base64:
            print(f"Successfully generated TTS audio for '{clean_text[:50]}...'")
        else:
            print(f"Failed to generate TTS audio for response.")

        return {
            "query": transcript,
            "response": response_text,
            "audio": audio_base64,
            "detected_lang": tts_lang
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/weekly-plan")
async def get_weekly_plan(lang: str = "English", db: Session = Depends(get_db)):
    """Generates or retrieves the 7-day plan based on context."""
    # 1. Get recent chat history (last 10 messages)
    history = db.query(ChatMessage).order_by(ChatMessage.timestamp.desc()).limit(10).all()
    history_data = [{"role": h.role, "content": h.content} for h in reversed(history)]

    # 2. Get latest farm log
    latest_log = db.query(FarmLog).order_by(FarmLog.timestamp.desc()).first()
    farm_context = {
        "soil_moisture": latest_log.soil_moisture if latest_log else 0.5,
        "temperature": latest_log.temperature if latest_log else 25.0,
        "crop_type": latest_log.crop_type if latest_log else "Corn"
    }

    # 3. Generate plan via LLM
    plan = llm_service.generate_weekly_plan(history_data, farm_context, language=lang)

    # 4. Save to DB
    new_plan = WeeklyPlanner(
        plan_data=json.dumps(plan),
        context_summary=f"Based on {len(history)} messages and latest sensor data."
    )
    db.add(new_plan)
    db.commit()

    return plan

class CropAdvisorRequest(BaseModel):
    location: str
    months: List[str]
    soil_type: str
    field_area: float
    language: Optional[str] = "English"

@app.post("/crop-recommendation")
async def crop_recommendation(data: CropAdvisorRequest):
    """
    Detailed crop advisor based on location, months, soil and area.
    """
    return llm_service.generate_crop_recommendations(
        location=data.location,
        months=data.months,
        soil_type=data.soil_type,
        field_area=data.field_area,
        language=data.language
    )

@app.get("/weather")
async def get_weather(q: str = "Ludhiana", lat: float = None, lon: float = None):
    """Fetch real-time agricultural weather for a specific location."""
    return await weather_service.get_current_weather(q=q, lat=lat, lon=lon)

@app.get("/location-suggestions")
async def location_suggestions(q: str):
    """Provides location autocomplete suggestions."""
    return await weather_service.get_location_suggestions(q=q)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
@app.post("/satellite/stats")
async def get_satellite_stats(data: SatelliteStatsRequest):
    """
    Fetches agricultural satellite statistics for a given area and date range.
    """
    try:
        stats = await satellite_service.get_stats(
            geometry=data.geometry,
            date_from=data.date_from,
            date_to=data.date_to
        )
        return stats
    except Exception as e:
        print(f"Satellite Stats Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
