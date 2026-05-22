import { useState, useEffect, useCallback } from 'react';
import AudioRecorder from '../components/AudioRecorder';
import Stopwatch from '../components/Stopwatch';
import LiveTranscription from '../components/LiveTranscription';
import AudioControls from '../components/AudioControls';

const RecordingView = ({ onRecordingComplete, onExit }) => {
  const [recordingState, setRecordingState] = useState('inactive'); // inactive, recording, paused, stopped
  const [transcriptionText, setTranscriptionText] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState(null);

  // Initialize audio recorder
  const {
    isRecording,
    isPaused,
    error: recorderError,
    transcription,
    transcriptionSupported,
    startRecording,
    togglePause,
    stopRecording,
    mediaRecorder
  } = AudioRecorder({
    onRecordingComplete: (audioBlob, transcription) => {
      onRecordingComplete?.({
        audioBlob,
        transcription: transcription || transcriptionText,
        duration: elapsedTime,
        timestamp: new Date().toISOString()
      });
    },
    onStateChange: (state) => {
      setRecordingState(state);
    },
    onTranscriptionUpdate: (text) => {
      setTranscriptionText(text);
    }
  });

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return; // Don't handle shortcuts when typing
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (isRecording) {
          togglePause();
        }
        break;
      case 'Escape':
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        }
        break;
      default:
        break;
    }
  }, [isRecording, togglePause, stopRecording]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle recorder errors
  useEffect(() => {
    if (recorderError) {
      setError(recorderError);
    }
  }, [recorderError]);

  // Update transcription text when transcription changes
  useEffect(() => {
    if (transcription) {
      setTranscriptionText(transcription);
    }
  }, [transcription]);

  const handleStartRecording = async () => {
    setError(null);
    try {
      await startRecording();
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const handlePauseRecording = () => {
    togglePause();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleExit = () => {
    if (isRecording) {
      if (window.confirm('Recording is in progress. Are you sure you want to exit?')) {
        stopRecording();
        onExit?.();
      }
    } else {
      onExit?.();
    }
  };

  return (
    <div className="recording-view">
      {/* Header */}
      <div className="recording-header">
        <button 
          className="exit-button"
          onClick={handleExit}
          title="Exit Recording"
        >
          <span className="material-icons">close</span>
        </button>
        <h1 className="recording-title">Audio Recording</h1>
        <div className="recording-status">
          {recordingState === 'recording' && (
            <span className="status-badge recording">Recording</span>
          )}
          {recordingState === 'paused' && (
            <span className="status-badge paused">Paused</span>
          )}
          {recordingState === 'stopped' && (
            <span className="status-badge stopped">Stopped</span>
          )}
          {!transcriptionSupported && (
            <span className="status-badge warning">No Transcription</span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="material-icons">error</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

      {/* Transcription Support Warning */}
      {!transcriptionSupported && !error && (
        <div className="warning-message">
          <span className="material-icons">warning</span>
          <span>Speech recognition not supported in this browser. Recording will work without transcription.</span>
        </div>
      )}

      {/* Main Content */}
      <div className="recording-content">
        {/* Top Section - Stopwatch */}
        <div className="stopwatch-section">
          <Stopwatch
            isRunning={isRecording}
            isPaused={isPaused}
            onTimeUpdate={setElapsedTime}
          />
        </div>

        {/* Center Section - Live Transcription */}
        <div className="transcription-section">
          <LiveTranscription
            isRecording={isRecording}
            isPaused={isPaused}
            transcriptionText={transcriptionText}
            onTranscriptionUpdate={setTranscriptionText}
            transcriptionSupported={transcriptionSupported}
          />
        </div>

        {/* Bottom Section - Controls */}
        <div className="controls-section">
          <AudioControls
            isRecording={isRecording}
            isPaused={isPaused}
            onStart={handleStartRecording}
            onPause={handlePauseRecording}
            onStop={handleStopRecording}
            disabled={!!error}
          />
        </div>
      </div>
    </div>
  );
};

export default RecordingView; 