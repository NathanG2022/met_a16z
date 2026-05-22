const TEXT_ANALYSIS_API_URL = process.env.TEXT_ANALYSIS_API_URL || 'http://localhost:8000';

async function analyzeTranscript(transcript, userId) {
  if (!transcript || !transcript.trim()) {
    return { success: false, error: 'Empty transcript' };
  }

  try {
    const res = await fetch(`${TEXT_ANALYSIS_API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        user_id: userId || 'anonymous',
        use_ai: true
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { success: false, error: `Analysis API ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = await res.json();
    return { success: true, analysis: data };
  } catch (error) {
    return { success: false, error: `Analysis API unreachable: ${error.message}` };
  }
}

module.exports = { analyzeTranscript };
