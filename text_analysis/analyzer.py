import re
from collections import Counter

class CommunicationAnalyzer:
    """
    Analyzes text for filler words and vocabulary quality
    """
    
    # Define filler words we want to track
    FILLER_WORDS = {
        'um': ['um', 'umm', 'ummm'],
        'uh': ['uh', 'uhh', 'uhhh'],
        'like': ['like'],
        'you_know': ['you know'],
        'so': ['so']
    }
    
    # Weak/vague words that should be replaced with more specific alternatives
    WEAK_WORDS = {
        'thing', 'things', 'stuff', 'very', 'really', 'just', 'actually', 
        'basically', 'literally', 'honestly', 'obviously', 'clearly',
        'kind of', 'sort of', 'a lot', 'a bit', 'pretty much'
    }
    
    # Hedge words that show uncertainty
    HEDGE_WORDS = {
        'maybe', 'perhaps', 'possibly', 'probably', 'might', 'could',
        'i think', 'i guess', 'i feel like', 'kind of', 'sort of'
    }
    
    def __init__(self, transcript: str):
        self.transcript = transcript.lower()
        self.original_transcript = transcript  # Keep original for context
        self.words = self._extract_words()
    
    def _extract_words(self):
        """Extract individual words from the transcript"""
        words = re.findall(r'\b[a-z]+\b', self.transcript)
        return words
    
    def count_filler_words(self):
        """Count occurrences of each filler word type"""
        counts = {
            'um_count': 0,
            'uh_count': 0,
            'like_count': 0,
            'you_know_count': 0,
            'so_count': 0
        }
        
        # Count "you know" separately
        counts['you_know_count'] = self.transcript.count('you know')
        
        # Count other filler words
        for word in self.words:
            if word in self.FILLER_WORDS['um']:
                counts['um_count'] += 1
            elif word in self.FILLER_WORDS['uh']:
                counts['uh_count'] += 1
            elif word in self.FILLER_WORDS['like']:
                counts['like_count'] += 1
            elif word in self.FILLER_WORDS['so']:
                counts['so_count'] += 1
        
        counts['total_filler_words'] = sum(counts.values())
        return counts
    
    def detect_weak_words(self):
        """Find weak/vague words that should be more specific"""
        weak_found = []
        word_counts = Counter(self.words)
        
        for word in self.WEAK_WORDS:
            if ' ' in word:  # Multi-word phrases
                count = self.transcript.count(word)
                if count > 0:
                    weak_found.append({'word': word, 'count': count, 'type': 'vague'})
            else:  # Single words
                count = word_counts.get(word, 0)
                if count > 0:
                    weak_found.append({'word': word, 'count': count, 'type': 'vague'})
        
        return sorted(weak_found, key=lambda x: x['count'], reverse=True)
    
    def detect_hedge_words(self):
        """Find hedge words that indicate uncertainty"""
        hedge_found = []
        
        for phrase in self.HEDGE_WORDS:
            if ' ' in phrase:
                count = self.transcript.count(phrase)
            else:
                count = self.words.count(phrase)
            
            if count > 0:
                hedge_found.append({'word': phrase, 'count': count, 'type': 'hedge'})
        
        return sorted(hedge_found, key=lambda x: x['count'], reverse=True)
    
    def calculate_vocabulary_level(self):
        """Estimate vocabulary sophistication"""
        if not self.words:
            return 0
        
        # Simple heuristic: longer words = more sophisticated
        avg_word_length = sum(len(word) for word in self.words) / len(self.words)
        
        # Score from 1-10
        # Average word length: 4-5 letters = basic, 6-7 = intermediate, 8+ = advanced
        if avg_word_length < 4.5:
            level = "basic"
            score = 3
        elif avg_word_length < 6:
            level = "intermediate"
            score = 6
        else:
            level = "advanced"
            score = 9
        
        return {
            'level': level,
            'score': score,
            'avg_word_length': round(avg_word_length, 1)
        }
    
    def analyze_vocabulary(self):
        """Analyze vocabulary diversity and find overused words"""
        total_words = len(self.words)
        unique_words = len(set(self.words))
        
        # Calculate vocabulary diversity (0 to 1, higher is better)
        diversity = unique_words / total_words if total_words > 0 else 0
        
        # Find overused words (excluding common words)
        common_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
            'for', 'of', 'with', 'is', 'was', 'are', 'were', 'i', 'you', 
            'he', 'she', 'it', 'we', 'they', 'have', 'has', 'had', 'be',
            'been', 'being', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'can', 'may', 'might', 'must', 'that', 'this', 'these',
            'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
        }
        
        word_counts = Counter(self.words)
        
        overused = []
        for word, count in word_counts.most_common(20):
            if word not in common_words and count > 2:
                overused.append({'word': word, 'count': count})
        
        # Get weak and hedge words
        weak_words = self.detect_weak_words()
        hedge_words = self.detect_hedge_words()
        vocab_level = self.calculate_vocabulary_level()
        
        return {
            'total_words': total_words,
            'unique_words': unique_words,
            'vocabulary_diversity': round(diversity, 2),
            'overused_words': overused[:10],  # Top 10 only
            'weak_words': weak_words,
            'hedge_words': hedge_words,
            'vocabulary_level': vocab_level
        }
    
    def get_full_analysis(self):
        """Get complete analysis of the transcript"""
        filler_analysis = self.count_filler_words()
        vocab_analysis = self.analyze_vocabulary()
        
        return {
            **filler_analysis,
            **vocab_analysis
        }