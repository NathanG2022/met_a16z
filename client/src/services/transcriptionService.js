class TranscriptionService {
  constructor() {
    this.recognition = null;
    this.supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.shouldBeListening = false;
  }

  initialize() {
    if (!this.supported) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition settings
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    // Set up event handlers
    this.recognition.onresult = (event) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event) => {
      this.handleError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Restart if we were supposed to be listening
      if (this.shouldBeListening) {
        this.start();
      }
    };
  }

  handleResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    let maxConfidence = 0;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence || 0;
      
      // Track the highest confidence score
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
      }
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        this.finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    const fullTranscript = this.finalTranscript + interimTranscript;
    
    // Clean up the transcript for better sentence detection
    const cleanedTranscript = fullTranscript
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+([.!?])/g, '$1') // Remove spaces before punctuation
      .trim();
    
    if (this.onResultCallback) {
      this.onResultCallback({
        final: this.finalTranscript,
        interim: interimTranscript,
        full: cleanedTranscript,
        confidence: maxConfidence,
        isFinal: finalTranscript.length > 0
      });
    }
  }

  handleError(event) {
    console.error('Transcription error:', event.error);
    
    if (this.onErrorCallback) {
      this.onErrorCallback({
        error: event.error,
        message: this.getErrorMessage(event.error)
      });
    }
  }

  getErrorMessage(error) {
    const errorMessages = {
      'no-speech': 'No speech detected. Please try speaking again.',
      'audio-capture': 'Audio capture failed. Please check your microphone.',
      'not-allowed': 'Microphone access denied. Please allow microphone access.',
      'network': 'Network error occurred. Please check your connection.',
      'service-not-allowed': 'Speech recognition service not allowed.',
      'bad-grammar': 'Speech recognition grammar error.',
      'language-not-supported': 'Language not supported.'
    };
    
    return errorMessages[error] || 'An unknown error occurred with speech recognition.';
  }

  start(onResult, onError) {
    if (!this.recognition) {
      this.initialize();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.shouldBeListening = true;
    this.isListening = true;
    this.finalTranscript = '';
    this.interimTranscript = '';

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting transcription:', error);
      if (onError) {
        onError({
          error: 'start-failed',
          message: 'Failed to start transcription service.'
        });
      }
    }
  }

  stop() {
    this.shouldBeListening = false;
    this.isListening = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping transcription:', error);
      }
    }
  }

  pause() {
    this.shouldBeListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error pausing transcription:', error);
      }
    }
  }

  resume() {
    if (this.recognition) {
      this.shouldBeListening = true;
      this.start(this.onResultCallback, this.onErrorCallback);
    }
  }

  clear() {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  isSupported() {
    return this.supported;
  }

  getStatus() {
    return {
      isSupported: this.supported,
      isListening: this.isListening,
      shouldBeListening: this.shouldBeListening
    };
  }
}

export default TranscriptionService; 