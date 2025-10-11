from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict

from database import engine, get_db, Base
from models import AnalysisSession
from analyzer import CommunicationAnalyzer
from ai_analyzer import AIVocabularyAnalyzer
from fastapi.middleware.cors import CORSMiddleware

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Communication Coach API",
    description="AI-powered communication analysis for better speaking",
    version="2.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI analyzer with error handling
try:
    ai_analyzer = AIVocabularyAnalyzer()
except ValueError as e:
    print(f"Warning: AI analyzer not available: {e}")
    ai_analyzer = None

# Request/Response Models
class TranscriptRequest(BaseModel):
    transcript: str
    user_id: Optional[str] = "anonymous"
    use_ai: Optional[bool] = True

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
    overused_words: List[Dict]
    weak_words: List[Dict]
    hedge_words: List[Dict]
    vocabulary_level: Dict
    simple_feedback: str
    ai_analysis: Optional[Dict] = None
    progress_comparison: Optional[Dict] = None

@app.get("/")
def read_root():
    """Welcome endpoint with API information"""
    return {
        "message": "Welcome to Communication Coach API v2.0!",
        "description": "AI-powered speech analysis for better communication",
        "features": [
            "Filler word detection (um, uh, like, etc.)",
            "Weak/vague word identification",
            "Hedge word detection (uncertainty markers)",
            "Vocabulary diversity analysis",
            "AI-powered context-aware suggestions",
            "Progress tracking over time"
        ],
        "endpoints": {
            "/analyze": "POST - Analyze a transcript with AI suggestions",
            "/sessions/{user_id}": "GET - Get all sessions for a user",
            "/session/{session_id}": "GET - Get specific session details",
            "/progress/{user_id}": "GET - Get progress summary"
        }
    }

@app.post("/analyze", response_model=AnalysisResponse)
def analyze_transcript(request: TranscriptRequest, db: Session = Depends(get_db)):
    """
    Comprehensive transcript analysis with AI-powered vocabulary suggestions
    
    - Detects filler words (um, uh, like, you know, so)
    - Identifies weak/vague words (thing, stuff, very, really)
    - Finds hedge words showing uncertainty
    - Analyzes vocabulary diversity and sophistication
    - Provides AI-powered context-aware suggestions
    - Tracks progress vs previous sessions
    """
    
    # Run basic analysis
    analyzer = CommunicationAnalyzer(request.transcript)
    analysis = analyzer.get_full_analysis()
    
    # Count weak and hedge words for feedback
    weak_count = sum(w['count'] for w in analysis.get('weak_words', []))
    hedge_count = sum(w['count'] for w in analysis.get('hedge_words', []))
    
    # Generate simple feedback
    if ai_analyzer:
        simple_feedback = ai_analyzer.get_simple_feedback(
            analysis['total_filler_words'],
            analysis['vocabulary_diversity'],
            analysis['total_words'],
            weak_count,
            hedge_count
        )
    else:
        simple_feedback = "AI analysis unavailable. Basic analysis completed."
    
    # Get AI-powered suggestions if requested
    ai_analysis = None
    if request.use_ai and ai_analyzer:
        ai_analysis = ai_analyzer.get_vocabulary_suggestions(
            request.transcript,
            analysis
        )
    
    # Get previous sessions for progress tracking
    previous_sessions = db.query(AnalysisSession).filter(
        AnalysisSession.user_id == request.user_id
    ).order_by(AnalysisSession.created_at.desc()).limit(10).all()
    
    # Convert to dicts for comparison
    prev_data = [{
        'total_filler_words': s.total_filler_words,
        'vocabulary_diversity': s.vocabulary_diversity
    } for s in previous_sessions]
    
    progress_comparison = None
    if ai_analyzer:
        progress_comparison = ai_analyzer.get_comparative_feedback(
            analysis,
            prev_data
        )
    
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
        overused_words=analysis['overused_words'],
        weak_words=analysis.get('weak_words', []),
        hedge_words=analysis.get('hedge_words', []),
        vocabulary_level=analysis['vocabulary_level']['level']
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Return comprehensive results
    return AnalysisResponse(
        session_id=session.id,
        simple_feedback=simple_feedback,
        ai_analysis=ai_analysis,
        progress_comparison=progress_comparison,
        **analysis
    )

@app.get("/sessions/{user_id}")
def get_user_sessions(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Get all analysis sessions for a specific user
    """
    sessions = db.query(AnalysisSession).filter(
        AnalysisSession.user_id == user_id
    ).order_by(AnalysisSession.created_at.desc()).limit(limit).all()
    
    return {
        "user_id": user_id,
        "total_sessions": len(sessions),
        "sessions": sessions
    }

@app.get("/session/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    """
    Get detailed results of a specific analysis session
    """
    session = db.query(AnalysisSession).filter(
        AnalysisSession.id == session_id
    ).first()
    
    if not session:
        return {"error": "Session not found"}
    
    return session

@app.get("/progress/{user_id}")
def get_progress_summary(user_id: str, db: Session = Depends(get_db)):
    """
    Get a summary of user's progress over all sessions
    """
    sessions = db.query(AnalysisSession).filter(
        AnalysisSession.user_id == user_id
    ).order_by(AnalysisSession.created_at).all()
    
    if not sessions:
        return {"error": "No sessions found for this user"}
    
    # Calculate trends
    filler_words_trend = [s.total_filler_words for s in sessions]
    diversity_trend = [s.vocabulary_diversity for s in sessions]
    
    return {
        "user_id": user_id,
        "total_sessions": len(sessions),
        "first_session_date": sessions[0].created_at,
        "latest_session_date": sessions[-1].created_at,
        "metrics": {
            "filler_words": {
                "first_session": filler_words_trend[0],
                "latest_session": filler_words_trend[-1],
                "average": sum(filler_words_trend) / len(filler_words_trend),
                "best": min(filler_words_trend),
                "trend": "improving" if filler_words_trend[-1] < filler_words_trend[0] else "needs_work"
            },
            "vocabulary_diversity": {
                "first_session": diversity_trend[0],
                "latest_session": diversity_trend[-1],
                "average": sum(diversity_trend) / len(diversity_trend),
                "best": max(diversity_trend),
                "trend": "improving" if diversity_trend[-1] > diversity_trend[0] else "needs_work"
            }
        },
        "all_sessions": sessions
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0"}