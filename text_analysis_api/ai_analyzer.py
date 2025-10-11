import os
from anthropic import Anthropic
from dotenv import load_dotenv
import json

load_dotenv()

class AIVocabularyAnalyzer:
    """
    Uses Claude AI to provide intelligent vocabulary suggestions and feedback
    """
    
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        try:
            self.client = Anthropic(api_key=api_key)
        except Exception as e:
            # Fallback for compatibility issues
            import httpx
            # Create a custom httpx client without problematic parameters
            custom_client = httpx.Client()
            self.client = Anthropic(api_key=api_key, http_client=custom_client)
    
    def get_vocabulary_suggestions(self, transcript: str, analysis_data: dict) -> dict:
        """
        Get comprehensive AI-powered vocabulary improvement suggestions
        """
        
        # Extract relevant data
        overused = analysis_data.get('overused_words', [])
        weak = analysis_data.get('weak_words', [])
        hedge = analysis_data.get('hedge_words', [])
        vocab_level = analysis_data.get('vocabulary_level', {})
        
        # Build context for Claude
        issues = []
        if overused:
            overused_list = [f"{w['word']} ({w['count']}x)" for w in overused[:5]]
            issues.append(f"Overused words: {', '.join(overused_list)}")
        if weak:
            weak_list = [f"{w['word']} ({w['count']}x)" for w in weak[:5]]
            issues.append(f"Vague words: {', '.join(weak_list)}")
        if hedge:
            hedge_list = [f"{w['word']} ({w['count']}x)" for w in hedge[:3]]
            issues.append(f"Hedge words (showing uncertainty): {', '.join(hedge_list)}")
        
        issues_text = "\n".join(issues) if issues else "No major issues detected"
        
        prompt = f"""You are an expert communication coach. Analyze this speech transcript and provide specific, actionable vocabulary improvements.

TRANSCRIPT:
"{transcript}"

DETECTED ISSUES:
{issues_text}

CURRENT VOCABULARY LEVEL: {vocab_level.get('level', 'unknown')} (avg word length: {vocab_level.get('avg_word_length', 0)} letters)

Provide a detailed analysis with these sections:

1. **Top 5 Specific Word Replacements**: For each problematic word/phrase found in the transcript, suggest 2-3 better alternatives that fit the context. Include the exact sentence where it appears and why the replacement is better.

2. **Tone & Confidence Assessment**: 
   - Describe the overall tone (professional, casual, uncertain, confident, etc.)
   - Rate confidence level (1-10)
   - Identify if hedge words are undermining the message

3. **Vocabulary Elevation Strategy**: 
   - One specific technique to immediately improve vocabulary
   - Suggest 3 advanced vocabulary words they could incorporate based on their topic

4. **Key Improvement Priority**: The single most impactful change they should make

Format your response as JSON:
{{
  "word_replacements": [
    {{
      "original": "exact word or phrase from transcript",
      "sentence": "the sentence where it appears",
      "alternatives": ["better option 1", "better option 2", "better option 3"],
      "reason": "why these alternatives are better",
      "impact": "high/medium/low"
    }}
  ],
  "tone_analysis": {{
    "overall_tone": "description",
    "confidence_score": 7,
    "confidence_notes": "explanation of score",
    "professionalism_score": 8
  }},
  "vocabulary_strategy": {{
    "immediate_technique": "one specific actionable technique",
    "suggested_advanced_words": ["word1", "word2", "word3"],
    "word_definitions": {{"word1": "definition and usage example"}}
  }},
  "priority_improvement": "the single most important change to make"
}}

Be specific and reference actual content from the transcript. Make suggestions practical and immediately applicable."""

        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = message.content[0].text
            
            # Try to parse JSON
            try:
                suggestions = json.loads(response_text)
            except json.JSONDecodeError:
                # If response isn't pure JSON, try to extract it
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    suggestions = json.loads(json_match.group())
                else:
                    suggestions = {"raw_response": response_text}
            
            return {
                "ai_suggestions": suggestions,
                "model_used": "claude-sonnet-4-20250514",
                "success": True
            }
            
        except Exception as e:
            return {
                "ai_suggestions": None,
                "error": f"AI analysis unavailable: {str(e)}",
                "success": False
            }
    
    def get_comparative_feedback(self, current_session: dict, previous_sessions: list) -> dict:
        """
        Compare current performance with previous sessions to show improvement
        
        Args:
            current_session: Current analysis results
            previous_sessions: List of previous session results
        
        Returns:
            Comparison and progress feedback
        """
        if not previous_sessions:
            return {
                "is_first_session": True,
                "message": "This is your first session! Keep practicing to track your improvement."
            }
        
        # Calculate averages from previous sessions
        prev_filler_avg = sum(s.get('total_filler_words', 0) for s in previous_sessions) / len(previous_sessions)
        prev_diversity_avg = sum(s.get('vocabulary_diversity', 0) for s in previous_sessions) / len(previous_sessions)
        
        current_filler = current_session.get('total_filler_words', 0)
        current_diversity = current_session.get('vocabulary_diversity', 0)
        
        # Calculate improvements
        filler_improvement = ((prev_filler_avg - current_filler) / prev_filler_avg * 100) if prev_filler_avg > 0 else 0
        diversity_improvement = ((current_diversity - prev_diversity_avg) / prev_diversity_avg * 100) if prev_diversity_avg > 0 else 0
        
        return {
            "is_first_session": False,
            "total_sessions": len(previous_sessions) + 1,
            "filler_word_trend": {
                "previous_average": round(prev_filler_avg, 1),
                "current": current_filler,
                "improvement_percent": round(filler_improvement, 1),
                "improved": filler_improvement > 0
            },
            "vocabulary_diversity_trend": {
                "previous_average": round(prev_diversity_avg, 2),
                "current": current_diversity,
                "improvement_percent": round(diversity_improvement, 1),
                "improved": diversity_improvement > 0
            },
            "overall_message": self._generate_progress_message(filler_improvement, diversity_improvement)
        }
    
    def _generate_progress_message(self, filler_improvement: float, diversity_improvement: float) -> str:
        """Generate encouraging progress message"""
        
        if filler_improvement > 10 and diversity_improvement > 5:
            return "Excellent progress! You're reducing filler words AND improving vocabulary diversity!"
        elif filler_improvement > 10:
            return "Great work reducing filler words! Now focus on vocabulary variety."
        elif diversity_improvement > 5:
            return "Your vocabulary is becoming more diverse! Now work on reducing filler words."
        elif filler_improvement > 0 or diversity_improvement > 0:
            return "You're making progress! Keep practicing consistently."
        else:
            return "This session had more challenges. Review the suggestions and try again!"
    
    def get_simple_feedback(self, filler_count: int, vocab_diversity: float, total_words: int, weak_count: int, hedge_count: int) -> str:
        """
        Generate comprehensive feedback based on all metrics
        """
        
        feedback = []
        
        # Filler word feedback
        filler_rate = (filler_count / total_words * 100) if total_words > 0 else 0
        
        if filler_rate > 5:
            feedback.append(f"⚠️ High filler word usage ({filler_rate:.1f}%). Practice pausing instead of using filler words.")
        elif filler_rate > 2:
            feedback.append(f"📊 Moderate filler word usage ({filler_rate:.1f}%). You're doing well!")
        else:
            feedback.append(f"✅ Excellent! Very low filler word usage ({filler_rate:.1f}%).")
        
        # Vocabulary diversity feedback
        if vocab_diversity > 0.7:
            feedback.append(f"✅ Great vocabulary diversity ({vocab_diversity:.2f})!")
        elif vocab_diversity > 0.5:
            feedback.append(f"📊 Good vocabulary diversity ({vocab_diversity:.2f}). Try incorporating more varied words.")
        else:
            feedback.append(f"⚠️ Low vocabulary diversity ({vocab_diversity:.2f}). Use more varied vocabulary.")
        
        # Weak words feedback
        if weak_count > 5:
            feedback.append(f"⚠️ High use of vague words ({weak_count} instances). Be more specific!")
        elif weak_count > 2:
            feedback.append(f"📊 Moderate vague word usage ({weak_count} instances). Could be more precise.")
        
        # Hedge words feedback
        if hedge_count > 3:
            feedback.append(f"⚠️ Many hedge words detected ({hedge_count} instances). Speak with more confidence!")
        
        return " ".join(feedback)