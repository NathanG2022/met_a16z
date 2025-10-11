from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.types import JSON
from database import Base
from datetime import datetime

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    transcript = Column(Text)
    um_count = Column(Integer, default=0)
    uh_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    you_know_count = Column(Integer, default=0)
    so_count = Column(Integer, default=0)
    total_filler_words = Column(Integer, default=0)
    total_words = Column(Integer, default=0)
    unique_words = Column(Integer, default=0)
    vocabulary_diversity = Column(Float, default=0.0)
    overused_words = Column(JSON)  # Store as JSON
    weak_words = Column(JSON)  # Vague words like "thing", "stuff"
    hedge_words = Column(JSON)  # Uncertainty words like "maybe", "I think"
    vocabulary_level = Column(String)  # basic, intermediate, advanced
    created_at = Column(DateTime, default=datetime.utcnow)