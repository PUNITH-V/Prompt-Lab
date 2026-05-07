from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///./history.db")
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class PromptHistory(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(String)
    technique = Column(String)
    output = Column(String)
    temperature = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)