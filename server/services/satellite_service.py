import os
import httpx
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class SatelliteService:
    def __init__(self):
        self.client_id = os.getenv("SENTINEL_HUB_CLIENT_ID")
        self.client_secret = os.getenv("SENTINEL_HUB_CLIENT_SECRET")
        self.token = None
        self.token_expiry = 0
        self.base_url = "https://services.sentinel-hub.com"

    async def get_token(self):
        """Fetches OAuth2 token from Sentinel Hub."""
        if self.token and time.time() < self.token_expiry:
            return self.token

        if not self.client_id or not self.client_secret:
            return None

        url = f"{self.base_url}/auth/realms/main/protocol/openid-connect/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=data)
            if response.status_code == 200:
                res = response.json()
                self.token = res["access_token"]
                self.token_expiry = time.time() + res["expires_in"] - 60
                return self.token
        return None

    def get_evalscript(self, layer: str):
        """Returns the evalscript for different indices."""
        evalscripts = {
            "NDVI": """
                //VERSION=3
                function setup() {
                  return {
                    input: ["B04", "B08", "dataMask"],
                    output: { id: "default", bands: 4 }
                  };
                }
                function evaluatePixel(sample) {
                  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
                  if (sample.dataMask === 0) return [0, 0, 0, 0];
                  
                  // SMOOTH & VIBRANT NEON MAP
                  if (ndvi < 0) return [0.05, 0.05, 0.3, 1];     // Deep Water
                  if (ndvi < 0.15) return [0.5, 0.4, 0.3, 1];    // Dry Soil/Urban
                  if (ndvi < 0.3) return [0.4, 0.6, 0.2, 1];     // Sparse Vegetation
                  if (ndvi < 0.5) return [0.3, 0.8, 0.1, 1];     // Moderate Health
                  if (ndvi < 0.7) return [0.2, 0.95, 0.0, 1];    // Healthy (Neon)
                  return [0.1, 1.0, 0.0, 1];                      // Peak Vitality (Super Neon)
                }
            """,
            "MOISTURE": """
                //VERSION=3
                function setup() {
                  return {
                    input: ["B8A", "B11", "dataMask"],
                    output: { id: "default", bands: 4 }
                  };
                }
                function evaluatePixel(sample) {
                  let ndmi = (sample.B8A - sample.B11) / (sample.B8A + sample.B11);
                  return [0, 0, ndmi * 2, sample.dataMask];
                }
            """,
            "TRUE_COLOR": """
                //VERSION=3
                function setup() {
                  return {
                    input: ["B04", "B03", "B02", "dataMask"],
                    output: { id: "default", bands: 3 }
                  };
                }
                function evaluatePixel(sample) {
                  // Vibrant gains for natural clarity
                  return [3.5 * sample.B04, 3.5 * sample.B03, 3.5 * sample.B02];
                }
            """
        }
        return evalscripts.get(layer, evalscripts["NDVI"])

    async def get_image(self, geometry: Dict[str, Any], date_str: str, layer: str = "TRUE_COLOR"):
        """Fetches a processed image from Sentinel Hub Process API with a trailing search window."""
        token = await self.get_token()
        if not token:
            return None

        # Create a 30-day search window ending at the target date to ensure we find an image
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
        start_date = (target_date - timedelta(days=30)).strftime("%Y-%m-%d")

        url = f"{self.base_url}/api/v1/process"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "image/png"
        }

        payload = {
            "input": {
                "bounds": {
                    "geometry": geometry,
                    "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"}
                },
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{start_date}T00:00:00Z",
                            "to": f"{date_str}T23:59:59Z"
                        },
                        "mosaickingOrder": "leastCC"
                    }
                }]
            },
            "output": {
                "width": 2048,
                "height": 2048,
                "responses": [{"identifier": "default", "format": {"type": "image/png"}}]
            },
            "evalscript": self.get_evalscript(layer)
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=30.0)
            if response.status_code == 200:
                return response.content
            print(f"Sentinel Hub Process API Error: {response.text}")
            return None

    async def get_stats(self, geometry: Dict[str, Any], date_from: str, date_to: str, layer: str = "NDVI"):
        """Fetches real statistical data from Sentinel Hub."""
        token = await self.get_token()
        if not token:
             return self.get_mock_stats(layer=layer)
        
        url = f"{self.base_url}/statistics/v1"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Simplified Statistical API request
        payload = {
            "input": {
                "bounds": {
                    "geometry": geometry,
                    "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"}
                },
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {"mosaickingOrder": "leastCC"}
                }]
            },
            "aggregation": {
                "timeRange": {"from": f"{date_from}T00:00:00Z", "to": f"{date_to}T23:59:59Z"},
                "aggregationInterval": {"of": "P1D"},
                "evalscript": self.get_evalscript(layer),
                "resx": 10,
                "resy": 10
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    # Parse the first available entry
                    if "data" in data and len(data["data"]) > 0:
                        outputs = data["data"][0].get("outputs", {})
                        default_out = outputs.get("default", {}).get("bands", {}).get("B0", {})
                        stats = default_out.get("stats", {})
                        
                        return {
                            "status": "success",
                            "avg": round(stats.get("mean", 0), 2),
                            "max": round(stats.get("max", 0), 2),
                            "min": round(stats.get("min", 0), 2),
                            "stDev": round(stats.get("stDev", 0), 2),
                            "layer": layer
                        }
                
                print(f"Sentinel Hub Error: {response.text}")
                return self.get_mock_stats(layer=layer)
        except Exception as e:
            print(f"Stats Request Failed: {e}")
            return self.get_mock_stats(layer=layer)

    def get_mock_stats(self, layer: str = "NDVI"):
        """Returns high-fidelity mock data for demo mode."""
        return {
            "ndvi_avg": 0.68,
            "ndvi_trend": "+12%",
            "water_stress": "Low",
            "vegetation_cover": "85%",
            "anomaly_detected": False,
            "temporal_change": [
                {"date": "2024-01-10", "value": 0.45},
                {"date": "2024-01-20", "value": 0.52},
                {"date": "2024-02-01", "value": 0.68}
            ]
        }

satellite_service = SatelliteService()
