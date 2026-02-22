import os
import json
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )

    def _clean_json(self, text: str) -> Dict[str, Any]:
        """Cleans and parses JSON from LLM response."""
        try:
            text = text.strip()
            if text.startswith("```"):
                lines = text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()
            return json.loads(text)
        except Exception as e:
            print(f"JSON Clean Error: {e}")
            raise e


    def generate_explanation(self, farm_data: Dict[str, Any], tasks: List[Dict[str, Any]], irrigation_prediction: Dict[str, Any], language: str = "English") -> Dict[str, Any]:
        """
        Generates real LLM explanations using OpenRouter.
        """
        try:
            lang_rule = (
                f"Respond ONLY in English using English (Latin) script."
                if language.lower() == "english"
                else f"Respond ONLY in {language}. You MUST write in the native script of {language} (e.g., Hindi: हिन्दी, Marathi: मराठी, Telugu: తెలుగు). DO NOT use English or transliterate into Latin characters."
            )

            prompt = f"""
            As an AI Farm Operations Copilot, generate a summary based on this data:
            Farm Data: {json.dumps(farm_data)}
            Prioritized Tasks: {json.dumps(tasks)}
            Irrigation Prediction: {json.dumps(irrigation_prediction)}
            
            LANGUAGE REQUIREMENT: {lang_rule}

            Provide a JSON response with:
            1. daily_action_plan: A 2-sentence summary of what to do today.
            2. reasons: A list of 3 specific reasons for these recommendations.
            3. resource_allocation: A sentence on how to best use the available labor and equipment.
            4. performance_insight: An insight into the current farm performance based on growth stage and field size.
            5. risk_alert: A warning about what happens if action is delayed, specifically mentioning any equipment-related risks or growth stage criticalities.
            6. dynamic_tasks: A list of 3-4 specialized tasks for this specific crop and state. Each task must be a JSON object: {{"id": "string", "task": "string", "category": "string", "base_score": float, "reason": "string"}}.
            7. confidence_level: A number between 0 and 1.
            
            Return ONLY raw JSON.
            """
            
            completion = self.client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[
                    {"role": "system", "content": "You are a professional agricultural operations assistant."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1500
            )
            
            return self._clean_json(completion.choices[0].message.content)
        except Exception as e:
            print(f"LLM Service Error: {e}")
            # Fallback
            return {
                "daily_action_plan": "Proceed with the prioritized task list. Ensure irrigation is monitored.",
                "reasons": ["Soil moisture trend", "Weather outlook", "Labor availability"],
                "resource_allocation": "Allocate labor based on high-priority irrigation tasks.",
                "performance_insight": f"Performing within expected margins for {farm_data.get('growth_stage', 'current')} stage.",
                "risk_alert": "Delayed action may impact yield stability and equipment longevity.",
                "dynamic_tasks": [
                    {"id": "irr1", "task": "Baseline Irrigation Check", "category": "Irrigation", "base_score": 0.9, "reason": "Consistent with local soil moisture trends."},
                    {"id": "maint1", "task": "General Crop Inspection", "category": "Maintenance", "base_score": 0.7, "reason": "Standard procedure for the current growth stage."}
                ],
                "confidence_level": 0.8
            }

    def generate_crop_recommendations(self, location: str, months: List[str], soil_type: str, field_area: float, language: str = "English") -> Dict[str, Any]:
        """
        Generates crop recommendations based on location, months, soil type and field area.
        """
        try:
            lang_rule = (
                f"Respond ONLY in English using English (Latin) script."
                if language.lower() == "english"
                else f"Respond ONLY in {language}. You MUST write in the native script of {language} (e.g., Hindi: हिन्दी, Marathi: मराठी, Telugu: తెలుగు). DO NOT use English or transliterate into Latin characters."
            )

            prompt = f"""
            You are a world-class agricultural advisor. Provide a Smart Crop Advisor report for:
            Location: {location}
            Growing Months: {', '.join(months)}
            Soil Type: {soil_type}
            Field Area: {field_area} acres
            
            LANGUAGE REQUIREMENT: {lang_rule}

            Based on historical weather data for this location and time of year, provide:
            1. summary of historical weather (avg temp in C, avg monthly rain in mm, avg humidity in %).
            2. Irrigation advice (status like 'SKIP IRRIGATION — HEAVY RAINFALL' or 'LOW IRRIGATION', litres per acre per day, total litres per day, frequency, a schedule note, and 4 specific technical tip strings for this situation).
            3. Top recommendation (Crop name, confidence score 0-100, season, rank 1, total ranks 5, and a short reason).
            4. 4 other recommended crops (name, season, match percentage, reason).
            
            Return ONLY raw JSON with keys: location, months (array), season (e.g. Kharif (June–October, monsoon season)), weather_summary (avg_temp, avg_rain, avg_humidity), irrigation_advice (status, litres_per_acre_day, total_litres_day, frequency, schedule_note, recommendations (array of 4 strings)), top_recommendation (name, confidence_score, season, rank, total_ranks, reason), other_crops (array of {{"name", "season", "match_percentage", "reason"}}).
            """
            
            completion = self.client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[
                    {"role": "system", "content": "You are a professional agricultural strategist."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1500
            )
            
            return self._clean_json(completion.choices[0].message.content)
        except Exception as e:
            print(f"Crop Advisor Error: {e}")
            return {
                "location": location,
                "months": months,
                "season": "General Season",
                "weather_summary": {"avg_temp": 28.5, "avg_rain": 150.2, "avg_humidity": 70.0},
                "irrigation_advice": {
                    "status": "NORMAL IRRIGATION",
                    "litres_per_acre_day": 4000,
                    "total_litres_day": 4000 * field_area,
                    "frequency": "Every 3 days",
                    "schedule_note": f"Maintain standard moisture for {soil_type} soil.",
                    "recommendations": ["Proper drainage", "Check root health", "Mulching", "Evening irrigation"]
                },
                "top_recommendation": {
                    "name": "Soybean", "confidence_score": 90, "season": "Kharif", "rank": 1, "total_ranks": 5, "reason": "Optimal humidity level."
                },
                "other_crops": []
            }

    def generate_weekly_plan(self, history: List[Dict[str, str]], farm_data: Dict[str, Any], language: str = "English") -> Dict[str, Any]:
        """
        Generates a 7-day tactical plan based on conversation history and current farm state.
        """
        try:
            lang_rule = (
                f"Respond ONLY in English using English (Latin) script."
                if language.lower() == "english"
                else f"Respond ONLY in {language}. You MUST write in the native script of {language} (e.g., Hindi: हिन्दी, Marathi: मराठी, Telugu: తెలుగు). DO NOT use English or transliterate into Latin characters."
            )

            prompt = f"""
            You are Kisaan AI, an expert agricultural strategist. 
            Based on the following conversation history and current farm data, construct a detailed 7-day Tactical Farm Planner.
            
            LANGUAGE REQUIREMENT: {lang_rule}

            Conversation Context:
            {json.dumps(history)}
            
            Current Farm Data:
            {json.dumps(farm_data)}
            
            Requirements for the 7-day plan:
            1. For each day, provide 2-3 specific agricultural tasks.
            2. Incorporate advice or concerns explicitly mentioned in the chat history.
            3. Consider the crop type and current moisture/temperature levels.
            4. Identify any critical risks for the week.
            
            Return a JSON object with this structure:
            {{
                "summary": "A high-level strategy for the week",
                "days": [
                    {{ "day": 1, "tasks": ["Task A", "Task B"], "urgency": "High/Medium/Low" }},
                    ... (7 days)
                ],
                "weekly_risk": "Main threat to watch out for this week"
            }}
            Return ONLY raw JSON.
            """
            
            completion = self.client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                messages=[
                    {"role": "system", "content": "You are a professional agricultural strategist."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1500
            )
            
            return self._clean_json(completion.choices[0].message.content)
        except Exception as e:
            print(f"Weekly Plan Error: {e}")
            return {
                "summary": "Standard operations recommended. Review irrigation daily.",
                "days": [{"day": i+1, "tasks": ["General crop monitoring"], "urgency": "Medium"} for i in range(7)],
                "weekly_risk": "Data synchronization error - maintain conservative water schedule."
            }

llm_service = LLMService()
