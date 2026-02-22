from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from .services.sarvam_service import SarvamService
import os
import shutil
import tempfile

app = FastAPI(title="Multilingual Voice-to-Voice Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key: sk_vxn0h1ck_o92JXIknYZBsFO0Xk8dr4Td5
sarvam = SarvamService(api_key="sk_vxn0h1ck_o92JXIknYZBsFO0Xk8dr4Td5")

# In-memory history (Simple list for demo, ideally Redis/Session based)
conversation_history = [
    {"role": "system", "content": "You are Barnaby, a highly intelligent and helpful AI assistant designed for farmers. You solve complex operational problems, offer irrigation advice, and troubleshoot equipment issues. Always be concise, encouraging, and clear. Maintain the language used by the user."}
]

@app.get("/")
async def root():
    return {"message": "Barnaby AI Voice Hub is Online"}

@app.get("/health")
async def health():
    return {"status": "ok", "assistant": "Barnaby AI"}

@app.post("/api/chat")
async def text_chat(request: dict):
    global conversation_history
    user_text = request.get("text", "")
    reset = request.get("reset", False)
    user_lang = request.get("user_lang", None)  # language user spoke in

    if reset:
        conversation_history = [conversation_history[0]]
        return {"response": "Conversation reset."}

    # Build messages to send — use shared history
    messages = list(conversation_history)

    # Prepare the user message — embed language instruction directly in text
    if user_lang:
        lang_names = {
            "hi-IN": "Hindi", "en-IN": "English", "ta-IN": "Tamil",
            "te-IN": "Telugu", "kn-IN": "Kannada", "ml-IN": "Malayalam",
            "mr-IN": "Marathi", "gu-IN": "Gujarati", "bn-IN": "Bengali",
            "pa-IN": "Punjabi", "or-IN": "Odia"
        }
        lang_name = lang_names.get(user_lang, user_lang)
        # Prepend language instruction directly in the user message (safe for all APIs)
        user_text_with_instruction = f"[Respond ONLY in {lang_name}] {user_text}"
    else:
        user_text_with_instruction = user_text

    # Add user message to history (store clean text without instruction)
    conversation_history.append({"role": "user", "content": user_text})
    messages.append({"role": "user", "content": user_text_with_instruction})
    
    # Get LLM Reasoning
    resp_text = sarvam.chat_completion(messages)
    
    if not resp_text:
        resp_text = "I'm sorry, I couldn't generate a response."

    # Use the user's detected language for TTS (same language they spoke in)
    tts_lang = user_lang if user_lang else sarvam.detect_language(resp_text)
    print(f"TTS language: {tts_lang}")

    # Add to history
    conversation_history.append({"role": "assistant", "content": resp_text})
    
    # Keep history manageable
    if len(conversation_history) > 10:
        conversation_history = [conversation_history[0]] + conversation_history[-6:]

    # Convert to voice using user's language
    audio_base64 = sarvam.text_to_speech(resp_text, language_code=tts_lang)
    
    return {
        "response": resp_text,
        "audio": audio_base64,
        "history_count": len(conversation_history),
        "detected_lang": tts_lang
    }

@app.post("/api/voice-chat")
async def voice_chat(file: UploadFile = File(...)):
    print(f"Received file: {file.filename}, Content-Type: {file.content_type}")
    
    # Save to OS temp directory to avoid uvicorn reloads
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        temp_path = tmp.name
    
    file_size = os.path.getsize(temp_path)
    print(f"Saved to {temp_path}, Size: {file_size} bytes")
    
    print(f"Transcribing audio file: {temp_path}")
    transcript, user_lang = sarvam.speech_to_text(temp_path, language_code="unknown")
    
    # Cleanup temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
    
    print(f"Transcript: {transcript} | User language: {user_lang}")
    
    if not transcript or "Could not transcribe" in transcript:
        print(f"Transcription failed")
        return {"query": transcript, "response": "I couldn't hear you clearly.", "audio": None}

    chat_result = await text_chat({"text": transcript, "user_lang": user_lang})
    
    return {
        "query": transcript,
        "response": chat_result.get("response", "I'm sorry, I couldn't process that."),
        "audio": chat_result.get("audio"),
        "detected_lang": chat_result.get("detected_lang")
    }
