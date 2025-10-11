from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import engine, get_db, Base
from models import AnalysisSession
from analyzer import CommunicationAnalyzer

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Communication Coach API")

# Define what data we expect to receive
class TranscriptRequest(BaseModel):
    transcript: str
    user_id: Optional[str] = "anonymous"

# Define what data we send back
class AnalysisResponse(BaseModel):
    session_id: int
    um_count: int
    uh_count: int
    like_count: int
    you_know_count: int
    so_count: int
    total_filler_words: int
    total_words: int
    unique_words: int
    vocabulary_diversity: float
    overused_words: list

@app.get("/")
def read_root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to Communication Coach API!",
        "endpoints": {
            "/analyze": "POST - Analyze a transcript",
            "/sessions/{user_id}": "GET - Get all sessions for a user",
            "/session/{session_id}": "GET - Get specific session details"
        }
    }

@app.post("/analyze", response_model=AnalysisResponse)
def analyze_transcript(request: TranscriptRequest, db: Session = Depends(get_db)):
    """
    Analyze a transcript for filler words and vocabulary
    """
    # Create analyzer
    analyzer = CommunicationAnalyzer(request.transcript)
    
    # Get analysis results
    analysis = analyzer.get_full_analysis()
    
    # Save to database
    session = AnalysisSession(
        user_id=request.user_id,
        transcript=request.transcript,
        um_count=analysis['um_count'],
        uh_count=analysis['uh_count'],
        like_count=analysis['like_count'],
        you_know_count=analysis['you_know_count'],
        so_count=analysis['so_count'],
        total_filler_words=analysis['total_filler_words'],
        total_words=analysis['total_words'],
        unique_words=analysis['unique_words'],
        vocabulary_diversity=analysis['vocabulary_diversity'],
        overused_words=analysis['overused_words']
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Return results
    return AnalysisResponse(
        session_id=session.id,
        **analysis
    )

@app.get("/sessions/{user_id}")
def get_user_sessions(user_id: str, db: Session = Depends(get_db)):
    """
    Get all analysis sessions for a specific user
    """
    sessions = db.query(AnalysisSession).filter(
        AnalysisSession.user_id == user_id
    ).all()
    
    return {"user_id": user_id, "total_sessions": len(sessions), "sessions": sessions}

@app.get("/session/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    """
    Get details of a specific session
    """
    session = db.query(AnalysisSession).filter(
        AnalysisSession.id == session_id
    ).first()
    
    if not session:
        return {"error": "Session not found"}
    
    return session