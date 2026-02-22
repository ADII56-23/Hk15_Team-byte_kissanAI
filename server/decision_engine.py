from typing import List, Dict, Any

class DecisionEngine:
    def generate_prioritized_tasks(self, irrigation_score: float, rain_probability: float, labor_available: int, 
                                 growth_stage: str = "sowing", field_size: float = 10.0, equipments: List[str] = []) -> List[Dict[str, Any]]:
        """
        Generate prioritized tasks based on:
        - irrigation urgency
        - rain probability
        - labor availability
        - growth stage
        - available equipment
        """
        labor_score = min(labor_available / 10.0, 1.0)
        
        # Base priority influenced by growth stage
        stage_multiplier = {
            "sowing": 0.8,
            "flowering": 1.2,
            "fruit": 1.0,
            "harvesting": 1.5
        }.get(growth_stage.lower(), 1.0)

        priority_score = ((0.6 * irrigation_score) + (0.3 * (1 - rain_probability)) + (0.1 * labor_score)) * stage_multiplier
        
        all_possible_tasks = [
            {
                "id": "irrigation",
                "task": "Activate Central Pivot Irrigation",
                "category": "Irrigation",
                "base_score": priority_score,
                "reason": f"Soil moisture levels are low ({int(irrigation_score * 100)}% deficiency) and rain probability is low ({int(rain_probability * 100)}%)."
            },
            {
                "id": "fertilizer",
                "task": "Apply Nitrogen Fertilizer (Plot B)",
                "category": "Maintenance",
                "base_score": priority_score * 0.8,
                "reason": "Optimal window before any potential light rain; soil temperature is ideal for absorption."
            },
            {
                "id": "harvest",
                "task": "Begin Early Harvest - North Sector",
                "category": "Harvest",
                "base_score": priority_score * 0.7 if labor_available > 5 else 0.2,
                "reason": "Crop maturity reached. Sufficient labor is available to complete the sector today."
            },
            {
                "id": "pest_control",
                "task": "Deploy Integrated Pest Management (IPM) Drone",
                "category": "Protection",
                "base_score": 0.5,
                "reason": "Scheduled weekly monitoring for potential beetle infestation."
            },
            {
                "id": "labor_reassignment",
                "task": "Reassign Labor to Greenhouse maintenance",
                "category": "Operations",
                "base_score": 0.9 if rain_probability > 0.8 else 0.1,
                "reason": "High probability of rain makes outdoor operations inefficient."
            }
        ]

        # Sort by score and take top 3
        sorted_tasks = sorted(all_possible_tasks, key=lambda x: x['base_score'], reverse=True)
        return sorted_tasks[:3]

engine = DecisionEngine()
