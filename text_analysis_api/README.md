# Communication Coach API

AI-powered speech analysis for better communication. Analyzes transcripts for filler words, vocabulary quality, and provides intelligent suggestions.

## Features

- **Filler Word Detection**: Identifies "um", "uh", "like", "you know", "so"
- **Weak Word Detection**: Finds vague words like "thing", "stuff", "very", "really"
- **Hedge Word Detection**: Identifies uncertainty markers like "maybe", "I think"
- **Vocabulary Analysis**: Measures diversity and sophistication
- **AI-Powered Suggestions**: Context-aware vocabulary improvements via Claude AI
- **Progress Tracking**: Compare performance across sessions

## Setup

### Quick Setup
```bash
cd text_analysis
python setup.py
```

### Manual Setup
1. Navigate to this folder: `cd text_analysis`
2. Create virtual environment: `python3 -m venv venv`
3. Activate it: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` file: `cp .env.example .env`
6. Add your Anthropic API key to `.env`
7. Run server: `uvicorn main:app --reload`

The API will run on `http://127.0.0.1:8000`

### API Documentation
Visit `http://127.0.0.1:8000/docs` for interactive API documentation.

## How to Use (For Audio Processing Team)

Send the transcribed text to the `/analyze` endpoint:

**Example Request:**
```python
import requests

response = requests.post(
    "http://127.0.0.1:8000/analyze",
    json={
        "transcript": "Um, so like, I was thinking, you know, that we should go",
        "user_id": "user123"
    }
)

result = response.json()
print(result)