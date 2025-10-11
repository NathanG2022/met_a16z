# Text Analysis API

This API analyzes speech transcripts for filler words and vocabulary quality.

## Setup

1. Navigate to this folder: `cd text_analysis`
2. Create virtual environment: `python3 -m venv venv`
3. Activate it: `source venv/bin/activate`
4. Install dependencies: `pip install fastapi uvicorn sqlalchemy`
5. Run server: `uvicorn main:app --reload`

The API will run on `http://127.0.0.1:8000`

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