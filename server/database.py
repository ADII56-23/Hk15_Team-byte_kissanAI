from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

SQLALCHEMY_DATABASE_URL = "sqlite:///./farm_operations.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ChatMessage(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    category = Column(String, nullable=True)

class FarmLog(Base):
    __tablename__ = "farm_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    soil_moisture = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    rain_probability = Column(Float)
    crop_type = Column(String)
    labor_available = Column(Integer)

class WeeklyPlanner(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    plan_data = Column(Text)  # JSON string containing the 7-day tasks
    context_summary = Column(Text)  # Summary of the chat history used to generate this

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
