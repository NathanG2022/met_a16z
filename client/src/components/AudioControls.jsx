import React from 'react';

const AudioControls = ({ 
  isRecording, 
  isPaused, 
  onStart, 
  onPause, 
  onStop, 
  disabled = false 
}) => {
  const handleStart = () => {
    if (!disabled && !isRecording) {
      onStart();
    }
  };

  const handlePause = () => {
    if (!disabled && isRecording) {
      onPause();
    }
  };

  const handleStop = () => {
    if (!disabled && isRecording) {
      onStop();
    }
  };

  return (
    <div className="audio-controls">
      <div className="controls-container">
        {/* Start Recording Button */}
        {!isRecording && (
          <button
            className={`control-button start-button ${disabled ? 'disabled' : ''}`}
            onClick={handleStart}
            disabled={disabled}
            title="Start Recording"
          >
            <div className="button-icon">
              <span className="material-icons">mic</span>
            </div>
            <span className="button-text">Start Recording</span>
          </button>
        )}

        {/* Pause/Resume Button */}
        {isRecording && (
          <button
            className={`control-button pause-button ${isPaused ? 'resume' : 'pause'} ${disabled ? 'disabled' : ''}`}
            onClick={handlePause}
            disabled={disabled}
            title={isPaused ? 'Resume Recording' : 'Pause Recording'}
          >
            <div className="button-icon">
              <span className="material-icons">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </div>
            <span className="button-text">
              {isPaused ? 'Resume' : 'Pause'}
            </span>
          </button>
        )}

        {/* Stop Recording Button */}
        {isRecording && (
          <button
            className={`control-button stop-button ${disabled ? 'disabled' : ''}`}
            onClick={handleStop}
            disabled={disabled}
            title="Stop Recording"
          >
            <div className="button-icon">
              <span className="material-icons">stop</span>
            </div>
            <span className="button-text">Stop</span>
          </button>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="recording-indicator">
          <div className={`indicator-dot ${isPaused ? 'paused' : 'recording'}`}></div>
          <span className="indicator-text">
            {isPaused ? 'Recording Paused' : 'Recording Active'}
          </span>
        </div>
      )}

      {/* Keyboard Shortcuts Info */}
      <div className="keyboard-shortcuts">
        <span className="shortcut-hint">
          <kbd>Space</kbd> Pause/Resume
        </span>
        <span className="shortcut-hint">
          <kbd>Esc</kbd> Stop
        </span>
      </div>
    </div>
  );
};

export default AudioControls; 