import { useState, useRef, useEffect } from 'react';
import TranscriptionService from '../services/transcriptionService';

const AudioRecorder = ({ onRecordingComplete, onStateChange, onTranscriptionUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [transcriptionError, setTranscriptionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptionServiceRef = useRef(null);
  // Refs avoid the stale-closure bug where onstop captures empty initial state.
  const audioChunksRef = useRef([]);
  const transcriptionRef = useRef('');

  useEffect(() => {
    try {
      transcriptionServiceRef.current = new TranscriptionService();
    } catch (err) {
      console.warn('Speech recognition not available:', err);
      setTranscriptionError('Speech recognition not supported in this browser');
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscriptionError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        audioChunksRef.current = [];
        transcriptionRef.current = '';
        setTranscription('');
        setIsRecording(true);
        setIsPaused(false);
        onStateChange?.('recording');

        if (transcriptionServiceRef.current) {
          transcriptionServiceRef.current.start(
            (result) => {
              transcriptionRef.current = result.full;
              setTranscription(result.full);
              onTranscriptionUpdate?.(result.full);
            },
            (err) => {
              console.error('Transcription error:', err);
              setTranscriptionError(err.message);
            }
          );
        }
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        setIsPaused(false);
        onStateChange?.('stopped');

        if (transcriptionServiceRef.current) {
          transcriptionServiceRef.current.stop();
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete?.(audioBlob, transcriptionRef.current);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onpause = () => {
        setIsPaused(true);
        onStateChange?.('paused');
        if (transcriptionServiceRef.current) {
          transcriptionServiceRef.current.pause();
        }
      };

      mediaRecorder.onresume = () => {
        setIsPaused(false);
        onStateChange?.('recording');
        if (transcriptionServiceRef.current) {
          transcriptionServiceRef.current.resume();
        }
      };

      mediaRecorder.start(1000);
    } catch (err) {
      setError(err.message);
      console.error('Error starting recording:', err);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
    } else {
      mediaRecorderRef.current.pause();
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (transcriptionServiceRef.current) {
        transcriptionServiceRef.current.stop();
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    error: error || transcriptionError,
    transcription,
    startRecording,
    togglePause,
    stopRecording,
    mediaRecorder: mediaRecorderRef.current,
    transcriptionSupported: transcriptionServiceRef.current?.isSupported() || false
  };
};

export default AudioRecorder;
