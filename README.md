# Verba

Record your voice, get it transcribed, and get AI-driven feedback to improve your public speaking.

## Stack

- **client/** — React + Vite, Supabase Auth, Web Speech API for live transcript preview.
- **server/** — Express, Supabase (DB + Storage), OpenAI Whisper for transcription, OpenAI GPT for summaries.
- **text_analysis_api/** — FastAPI service that analyzes a transcript for filler words, weak/hedge words, and AI-powered vocabulary suggestions (Anthropic Claude).

The browser records audio → uploads to `server/` → server stores it in Supabase, transcribes with Whisper, summarizes with GPT, sends the transcript to `text_analysis_api/` for speaking-coach analysis, and persists the result on the note. The dashboard's "Details" modal renders the analysis as a Speaking Coach panel.

## Setup

```bash
# 1. Server
cd server
cp .env.example .env   # fill in SUPABASE_*, OPENAI_API_KEY
npm install
npm run dev            # http://localhost:5000

# 2. Python analysis API
cd ../text_analysis_api
cp .env.example .env   # fill in ANTHROPIC_API_KEY
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000

# 3. Client
cd ../client
cp .env.example .env   # fill in VITE_SUPABASE_*
npm install
npm run dev            # http://localhost:5173
```

`ffmpeg` must be on PATH for server-side audio conversion (`brew install ffmpeg`); if it's missing the server falls back to passing WebM directly to Whisper.
