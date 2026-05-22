import { useState, useEffect, useRef } from 'react';

const Stopwatch = ({ isRunning, isPaused, onTimeUpdate }) => {
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [pauseTime, setPauseTime] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  const intervalRef = useRef(null);

  // Format time as HH:MM:SS with leading zeros
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start the stopwatch
  useEffect(() => {
    if (isRunning && !isPaused) {
      if (!startTime) {
        setStartTime(Date.now());
      }
      
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime - totalPausedTime;
        setTime(elapsed);
        onTimeUpdate?.(elapsed);
      }, 100); // Update every 100ms for smooth display
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, startTime, totalPausedTime, onTimeUpdate]);

  // Handle pause/resume
  useEffect(() => {
    if (isPaused && isRunning) {
      setPauseTime(Date.now());
    } else if (!isPaused && isRunning && pauseTime) {
      const resumeTime = Date.now();
      const pausedDuration = resumeTime - pauseTime;
      setTotalPausedTime(prev => prev + pausedDuration);
      setPauseTime(0);
    }
  }, [isPaused, isRunning, pauseTime]);

  // Reset stopwatch when recording stops
  useEffect(() => {
    if (!isRunning) {
      setTime(0);
      setStartTime(null);
      setPauseTime(0);
      setTotalPausedTime(0);
      onTimeUpdate?.(0);
    }
  }, [isRunning, onTimeUpdate]);

  return (
    <div className="stopwatch-container">
      <div className={`stopwatch-display ${isRunning ? 'recording' : ''} ${isPaused ? 'paused' : ''}`}>
        {formatTime(time)}
      </div>
      <div className="stopwatch-status">
        {isRunning && !isPaused && (
          <span className="status recording">RECORDING</span>
        )}
        {isPaused && (
          <span className="status paused">PAUSED</span>
        )}
        {!isRunning && (
          <span className="status stopped">STOPPED</span>
        )}
      </div>
    </div>
  );
};

export default Stopwatch; 