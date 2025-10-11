import re
import json
from collections import Counter
from typing import Dict, List

class CommunicationAnalyzer:
    def __init__(self, transcript: str):
        self.transcript = transcript.lower()
        self.words = self._extract_words()
    
    def _extract_words(self) -> List[str]:
        """Extract words from transcript, removing punctuation"""
        # Remove punctuation and split into words
        words = re.findall(r'\b[a-zA-Z]+\b', self.transcript)
        return [word.lower() for word in words]
    
    def count_filler_words(self) -> Dict[str, int]:
        """Count common filler words"""
        filler_patterns = {
            'um': r'\bum\b',
            'uh': r'\buh\b', 
            'like': r'\blike\b',
            'you_know': r'\byou know\b',
            'so': r'\bso\b'
        }
        
        counts = {}
        for word, pattern in filler_patterns.items():
            counts[word + '_count'] = len(re.findall(pattern, self.transcript))
        
        return counts
    
    def analyze_vocabulary(self) -> Dict[str, any]:
        """Analyze vocabulary diversity and overused words"""
        if not self.words:
            return {
                'total_words': 0,
                'unique_words': 0,
                'vocabulary_diversity': 0.0,
                'overused_words': []
            }
        
        word_counts = Counter(self.words)
        total_words = len(self.words)
        unique_words = len(word_counts)
        vocabulary_diversity = unique_words / total_words if total_words > 0 else 0
        
        # Find overused words (appears more than 3 times and represents > 2% of total words)
        overused_threshold = max(3, total_words * 0.02)
        overused_words = [
            word for word, count in word_counts.items() 
            if count >= overused_threshold and len(word) > 2
        ]
        
        return {
            'total_words': total_words,
            'unique_words': unique_words,
            'vocabulary_diversity': round(vocabulary_diversity, 3),
            'overused_words': overused_words
        }
    
    def get_full_analysis(self) -> Dict[str, any]:
        """Get complete analysis of the transcript"""
        filler_analysis = self.count_filler_words()
        vocabulary_analysis = self.analyze_vocabulary()
        
        # Calculate total filler words
        total_filler_words = sum([
            filler_analysis['um_count'],
            filler_analysis['uh_count'],
            filler_analysis['like_count'],
            filler_analysis['you_know_count'],
            filler_analysis['so_count']
        ])
        
        # Convert overused_words to JSON string for database storage
        overused_words_json = json.dumps(vocabulary_analysis['overused_words'])
        
        return {
            **filler_analysis,
            'total_filler_words': total_filler_words,
            **vocabulary_analysis,
            'overused_words': overused_words_json
        }