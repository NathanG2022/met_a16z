import { useState, useEffect, useRef } from 'react';

const LiveTranscription = ({ isRecording, isPaused, transcriptionText, onTranscriptionUpdate }) => {
  const [transcriptionBuffer, setTranscriptionBuffer] = useState('');
  const [transcriptionHistory, setTranscriptionHistory] = useState([]);
  const [latestWords, setLatestWords] = useState('');
  const [sentenceBuffer, setSentenceBuffer] = useState('');
  const scrollRef = useRef(null);
  const lastProcessedLength = useRef(0);

  // Process transcription text into sentence chunks
  const processTranscription = (text) => {
    if (!text) return { sentences: [], latestWords: '' };

    // Split into sentences (look for periods, question marks, exclamation points)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const remainingText = text.replace(/[^.!?]+[.!?]+/g, '').trim();
    
    // Get the latest words (last 3-5 words or remaining text)
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const latestWords = words.slice(-3).join(' '); // Show last 3 words

    return { sentences, remainingText, latestWords };
  };

  // Update transcription buffer when new text arrives
  useEffect(() => {
    if (transcriptionText && transcriptionText !== transcriptionBuffer) {
      const previousText = transcriptionBuffer;
      setTranscriptionBuffer(transcriptionText);
      
      // Process the new text
      const { sentences, remainingText, latestWords } = processTranscription(transcriptionText);
      
      // Update latest words for the yellow box
      setLatestWords(latestWords);
      
      // Check if we have new complete sentences
      if (transcriptionText.length > lastProcessedLength.current) {
        const newText = transcriptionText.slice(lastProcessedLength.current);
        
        // Find new complete sentences
        const newSentences = newText.match(/[^.!?]+[.!?]+/g) || [];
        
        if (newSentences.length > 0) {
          // Add new sentences to history
          setTranscriptionHistory(prev => [
            ...prev,
            ...newSentences.map(sentence => ({
              text: sentence.trim(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'sentence'
            }))
          ]);
        }
        
        lastProcessedLength.current = transcriptionText.length;
      }
      
      onTranscriptionUpdate?.(transcriptionText);
    }
  }, [transcriptionText, transcriptionBuffer, onTranscriptionUpdate]);

  // Auto-scroll to bottom when new text arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptionBuffer, transcriptionHistory]);

  // Clear transcription when recording stops
  useEffect(() => {
    if (!isRecording) {
      setTranscriptionBuffer('');
      setTranscriptionHistory([]);
      setLatestWords('');
      setSentenceBuffer('');
      lastProcessedLength.current = 0;
    }
  }, [isRecording]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return timestamp;
  };

  // Get the current sentence being built
  const getCurrentSentence = () => {
    const { remainingText } = processTranscription(transcriptionBuffer);
    return remainingText;
  };

  return (
    <div className="live-transcription-container">
      <div className="transcription-header">
        <h3>Live Transcription</h3>
        <div className="transcription-status">
          {isRecording && !isPaused && (
            <span className="status-indicator recording">
              <span className="pulse-dot"></span>
              Live
            </span>
          )}
          {isPaused && (
            <span className="status-indicator paused">
              Paused
            </span>
          )}
          {!isRecording && (
            <span className="status-indicator stopped">
              Stopped
            </span>
          )}
        </div>
      </div>
      
      {/* Latest Words Box */}
      {isRecording && latestWords && (
        <div className="latest-words-box">
          <div className="latest-words-label">Latest:</div>
          <div className="latest-words-text">{latestWords}</div>
        </div>
      )}
      
      <div className="transcription-content" ref={scrollRef}>
        {transcriptionHistory.length === 0 ? (
          <div className="transcription-placeholder">
            {isRecording ? (
              <p>Start speaking to see live transcription...</p>
            ) : (
              <p>Click "Start Recording" to begin</p>
            )}
          </div>
        ) : (
          <div className="transcription-text">
            {/* Completed Sentences */}
            {transcriptionHistory.map((segment, index) => (
              <div key={index} className="transcription-segment sentence">
                <span className="segment-timestamp">
                  {formatTimestamp(segment.timestamp)}
                </span>
                <span className="segment-text">
                  {segment.text}
                </span>
              </div>
            ))}
            
            {/* Current Sentence Being Built */}
            {getCurrentSentence() && (
              <div className="transcription-segment current">
                <span className="segment-timestamp">
                  {new Date().toLocaleTimeString()}
                </span>
                <span className="segment-text building">
                  {getCurrentSentence()}
                  <span className="cursor">|</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="transcription-footer">
        <div className="transcription-stats">
          <span>Sentences: {transcriptionHistory.length}</span>
          <span>Words: {transcriptionBuffer.split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>Characters: {transcriptionBuffer.length}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTranscription; 