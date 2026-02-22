from typing import Dict, Union
import numpy as np

class IrrigationModel:
    def __init__(self):
        # In a real scenario, we would load a pre-trained model here
        # self.model = joblib.load('model.pkl')
        pass

    def predict(self, data: Dict[str, Union[float, str]]) -> Dict[str, Union[str, float]]:
        """
        Predicts irrigation urgency based on soil moisture, temperature, humidity, rain probability, and crop type.
        """
        soil_moisture = data.get('soil_moisture', 0.5)
        temperature = data.get('temperature', 25.0)
        humidity = data.get('humidity', 50.0)
        rain_probability = data.get('rain_probability', 0.1)
        crop_type = data.get('crop_type', 'Corn')

        # Logic-based scoring to simulate an ML model
        # Lower moisture + higher temp + lower rain prob = higher urgency
        
        # Normalize/Scale inputs
        moisture_factor = (1 - soil_moisture) * 0.5
        temp_factor = (temperature / 40.0) * 0.2 if temperature > 20 else 0
        humidity_factor = (1 - (humidity / 100.0)) * 0.1
        rain_factor = (1 - rain_probability) * 0.2
        
        # Crop specific adjustments
        crop_multipliers = {
            'Corn': 1.0,
            'Wheat': 0.8,
            'Rice': 1.5,
            'Soybeans': 0.9,
            'Cotton': 1.1
        }
        multiplier = crop_multipliers.get(crop_type, 1.0)
        
        urgency_score = (moisture_factor + temp_factor + humidity_factor + rain_factor) * multiplier
        urgency_score = min(max(urgency_score, 0.0), 1.0) # Clamp between 0 and 1

        if urgency_score < 0.3:
            urgency = "Low"
        elif urgency_score < 0.7:
            urgency = "Medium"
        else:
            urgency = "High"

        return {
            "irrigation_urgency": urgency,
            "urgency_score": round(urgency_score, 2)
        }

model = IrrigationModel()
