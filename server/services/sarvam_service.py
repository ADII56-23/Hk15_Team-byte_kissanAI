import requests
import base64
import re
import struct

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
        Handles texts > 500 characters by chunking and merging WAVs.
        """
        url = "https://api.sarvam.ai/text-to-speech"
        
        # Fallback for unknown language
        if language_code == "unknown":
            language_code = "en-IN"
            
        # Helper to chunk text
        def chunk_text(t, max_chars=500):
            # Split by sentences but keep punctuation
            sentences = re.split(r'([.!?]\s+)', t)
            chunks = []
            current_chunk = ""
            i = 0
            while i < len(sentences):
                sentence = sentences[i]
                if i+1 < len(sentences) and re.match(r'[.!?]\s+', sentences[i+1]):
                    sentence += sentences[i+1]
                    i += 1
                
                if len(current_chunk) + len(sentence) <= max_chars:
                    current_chunk += sentence
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    
                    if len(sentence) > max_chars:
                        # Force split very long sentences
                        words = sentence.split(' ')
                        temp_chunk = ""
                        for word in words:
                            if len(temp_chunk) + len(word) + 1 <= max_chars:
                                temp_chunk += word + " "
                            else:
                                chunks.append(temp_chunk.strip())
                                temp_chunk = word + " "
                        current_chunk = temp_chunk
                    else:
                        current_chunk = sentence
                i += 1
            if current_chunk:
                chunks.append(current_chunk.strip())
            return [c for c in chunks if c]

        # Helper to merge WAVs
        def merge_wavs(base64_wavs):
            if not base64_wavs: return None
            if len(base64_wavs) == 1: return base64_wavs[0]
            
            decoded_audios = [base64.b64decode(a) for a in base64_wavs]
            # Use headers from the first one
            header = bytearray(decoded_audios[0][:44])
            # Concatenate data chunks (everything after 44 bytes)
            combined_data = b"".join([a[44:] for a in decoded_audios if len(a) > 44])
            
            # Update Subchunk2Size (offset 40)
            data_size = len(combined_data)
            header[40:44] = struct.pack("<I", data_size)
            # Update ChunkSize (offset 4)
            header[4:8] = struct.pack("<I", data_size + 44 - 8)
            
            return base64.b64encode(header + combined_data).decode("utf-8")

        text_chunks = chunk_text(text)
        print(f"Sarvam TTS: Processing {len(text_chunks)} chunks for text length {len(text)}")
        
        payload = {
            "inputs": text_chunks,
            "model": "bulbul:v2",
            "target_language_code": language_code,
            "speaker": "anushka",
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 22050
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            if response.status_code != 200:
                print(f"Sarvam TTS Error {response.status_code}: {response.text}")
            response.raise_for_status()
            data = response.json()
            if "audios" in data and len(data["audios"]) > 0:
                return merge_wavs(data["audios"])
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
            # First try to detect language
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            lang = data.get("lang_code", "en")
            
            mapping = {
                "hi": "hi-IN", "en": "en-IN", "bn": "bn-IN", "ta": "ta-IN",
                "te": "te-IN", "kn": "kn-IN", "ml": "ml-IN", "mr": "mr-IN",
                "gu": "gu-IN", "pa": "pa-IN", "or": "od-IN", "od": "od-IN"
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
        try:
            # Use 'saaras:v1' specifically as it is very stable with simple form-data
            # Valid Sarvam language codes as per latest error logs
            valid_codes = [
                'hi-IN', 'en-IN', 'bn-IN', 'ta-IN', 'te-IN', 'kn-IN', 
                'ml-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'od-IN', 'as-IN', 
                'ur-IN', 'ne-IN', 'kok-IN', 'ks-IN', 'sd-IN', 'sa-IN', 
                'sat-IN', 'mni-IN', 'brx-IN', 'mai-IN', 'doi-IN', 'unknown'
            ]
            
            data = {
                'model': 'saaras:v3',
                'language_code': language_code if language_code in valid_codes else 'en-IN'
            }
            response = requests.post(url, files=files, data=data, headers=self.headers)
            if response.status_code != 200:
                print(f"Sarvam STT Error {response.status_code}: {response.text}")
            response.raise_for_status()
            result = response.json()
            transcript = result.get("transcript", "")
            detected_lang = result.get("language_code", language_code)
            return transcript, detected_lang
        except Exception as e:
            print(f"Error in Sarvam STT: {e}")
            return "Could not transcribe audio.", language_code
