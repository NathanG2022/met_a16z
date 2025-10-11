from sqlalchemy import Column, Integer, String, Float, Text
from database import Base

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
    overused_words = Column(Text)  # Will store as JSON string