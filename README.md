# AI Farm Operations Copilot

An intelligent decision-support system that converts farm data into actionable operational plans using ML and LLM-driven insights.

## Project Structure

- `/client`: React frontend built with Vite, Tailwind CSS, and Lucide icons.
- `/server`: FastAPI backend featuring the ML prediction layer and decision engine.

## Features

- **Irrigation Urgency Prediction**: ML-simulated logic to predict when crops need water.
- **Task Prioritization**: Decision engine that ranks tasks based on irrigation need, weather, and labor.
- **Explainable AI**: Structured action plans with detailed reasoning for every recommendation.
- **Dynamic Dashboard**: Responsive UI with weather integration, forecast charts, and a chat interface.

## Quick Start

### Backend
1. `cd server`
2. `python -m pip install -r requirements.txt`
3. `python main.py`

### Frontend
1. `cd client`
2. `npm install`
3. `npm run dev`

## Tech Stack
- **Frontend**: React, Tailwind CSS v4, Recharts, Lucide, Framer Motion.
- **Backend**: FastAPI, Scikit-learn, Numpy, Uvicorn.
