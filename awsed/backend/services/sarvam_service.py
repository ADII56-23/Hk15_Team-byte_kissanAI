import requests
import base64

class SarvamService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Based on research, headers use 'api-subscription-key'
        self.headers = {
            "api-subscription-key": self.api_key
        }

    def chat_completion(self, messages: list, model: str = "sarvam-m"):
        """
        Sends a conversation history to Sarvam AI's LLM for intelligent reasoning.
        """
        url = "https://api.sarvam.ai/v1/chat/completions"
        payload = {
            "model": model,
            "messages": messages
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"]
            return "I am processing your request."
        except Exception as e:
            print(f"Error in Sarvam LLM: {e}")
            return "My reasoning engine is temporarily offline."

    def text_to_speech(self, text: str, language_code: str = "en-IN"):
        """
        Converts text to speech using Sarvam AI Bulbul model.
        Returns base64 encoded audio string.
        """
        url = "https://api.sarvam.ai/text-to-speech"
        payload = {
            "inputs": [text],
            "target_language_code": language_code,
            "speaker": "anushka",
            "model": "bulbul:v2",
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 22050
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            if "audios" in data and len(data["audios"]) > 0:
                return data["audios"][0]
            return None
        except Exception as e:
            print(f"Error in Sarvam TTS: {e}")
            return None

    def detect_language(self, text: str):
        """
        Identifies the language of the input text using Sarvam's text-lid endpoint.
        Returns the language code (e.g., 'en-IN', 'hi-IN').
        """
        url = "https://api.sarvam.ai/text-lid"
        payload = {"input": text}
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            # The API returns language code like 'hi', we might need to map to 'hi-IN'
            lang = data.get("lang_code", "en")
            
            # Map common Indian languages to the -IN format expected by TTS
            mapping = {
                "hi": "hi-IN", "en": "en-IN", "bn": "bn-IN", "ta": "ta-IN",
                "te": "te-IN", "kn": "kn-IN", "ml": "ml-IN", "mr": "mr-IN",
                "gu": "gu-IN", "pa": "pa-IN", "or": "or-IN"
            }
            return mapping.get(lang.split('-')[0], "en-IN")
        except Exception as e:
            print(f"Error in Language Detection: {e}")
            return "en-IN"

    def speech_to_text(self, audio_file_path: str, language_code: str = "en-IN"):
        """
        Converts speech to text using Sarvam AI Saaras model.
        Returns a tuple of (transcript, detected_language_code).
        """
        url = "https://api.sarvam.ai/speech-to-text"
        files = {
            'file': ('audio.webm', open(audio_file_path, 'rb'), 'audio/webm')
        }
        data = {
            'model': 'saaras:v3',
            'language_code': language_code
        }
        
        try:
            response = requests.post(url, files=files, data=data, headers=self.headers)
            if response.status_code != 200:
                print(f"Sarvam STT Error {response.status_code}: {response.text}")
            response.raise_for_status()
            result = response.json()
            transcript = result.get("transcript", "")
            # Sarvam v3 returns the detected language code in the response
            detected_lang = result.get("language_code", language_code)
            print(f"STT detected language: {detected_lang}")
            return transcript, detected_lang
        except Exception as e:
            print(f"Error in Sarvam STT: {e}")
            return "Could not transcribe audio.", language_code
