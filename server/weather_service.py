import httpx
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("WEATHER_API_KEY")
        self.base_url = "http://api.weatherapi.com/v1/forecast.json"

    async def get_current_weather(self, q: str = "Ludhiana", lat: float = None, lon: float = None) -> Dict[str, Any]:
        """
        Fetches real-time weather data from WeatherAPI.com using the provided API key.
        Supports city names or coordinates.
        """
        if not self.api_key:
            return {
                "error": "Weather API key not configured",
                "current": {"temp": 28.5, "humidity": 45, "wind_speed": 12},
                "location": "Ludhiana (Simulated Mode)"
            }

        search_query = q
        if lat is not None and lon is not None:
            search_query = f"{lat},{lon}"

        params = {
            "key": self.api_key,
            "q": search_query,
            "days": 7,
            "aqi": "no",
            "alerts": "no"
        }
        
        max_retries = 3
        timeout = 15.0
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.get(self.base_url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    
                    # Extract and format relevant farm data
                    current = data.get("current", {})
                    forecast_days = data.get("forecast", {}).get("forecastday", [])
                    location = data.get("location", {})
                    
                    # Map 7-day forecast data
                    weekly_max = [day.get("day", {}).get("maxtemp_c") for day in forecast_days]
                    weekly_rain = [day.get("day", {}).get("totalprecip_mm") for day in forecast_days]
                    
                    return {
                        "current": {
                            "temp": current.get("temp_c"),
                            "humidity": current.get("humidity"),
                            "wind_speed": current.get("wind_kph"),
                            "condition_code": current.get("condition", {}).get("code"),
                            "feels_like": current.get("feelslike_c")
                        },
                        "forecast": {
                            "max_temp": weekly_max[0] if weekly_max else None,
                            "min_temp": forecast_days[0].get("day", {}).get("mintemp_c") if forecast_days else None,
                            "rain_sum": weekly_rain[0] if weekly_rain else None,
                            "weekly_max": weekly_max,
                            "weekly_rain": weekly_rain
                        },
                        "location": f"{location.get('name')}, {location.get('region')} (Precision)"
                    }
            except (httpx.ConnectTimeout, httpx.ReadTimeout) as e:
                print(f"Weather API Attempt {attempt + 1} timed out. Retrying...")
                if attempt == max_retries - 1:
                    break
            except Exception as e:
                print(f"Weather API Error: {e}")
                if attempt == max_retries - 1:
                    break
        
        # Fallback if all retries fail
        return {
            "error": "Connection timed out. Using cached/simulated data.",
            "current": {"temp": 28.5, "humidity": 45, "wind_speed": 12},
            "location": f"{q} (Offline Mode)"
        }

    async def get_location_suggestions(self, q: str):
        """
        Uses WeatherAPI search endpoint to provide location autocomplete suggestions.
        """
        if not self.api_key or len(q) < 3:
            return []

        url = "http://api.weatherapi.com/v1/search.json"
        params = {
            "key": self.api_key,
            "q": q
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Location Suggestions Error: {e}")
            return []

weather_service = WeatherService()
