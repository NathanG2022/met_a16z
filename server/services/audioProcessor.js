const { OpenAI } = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

class AudioProcessor {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
    
    // Check if ffmpeg is available
    this.checkFFmpeg();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Check if FFmpeg is available
  checkFFmpeg() {
    try {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          console.warn('FFmpeg not available or not properly configured:', err.message);
          this.ffmpegAvailable = false;
        } else {
          console.log('FFmpeg is available');
          this.ffmpegAvailable = true;
        }
      });
    } catch (error) {
      console.warn('FFmpeg check failed:', error.message);
      this.ffmpegAvailable = false;
    }
  }

  // Convert WebM to MP3 for better compatibility
  async convertAudioFormat(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      // Check if input file exists
      if (!fs.existsSync(inputPath)) {
        return reject(new Error(`Input file does not exist: ${inputPath}`));
      }

      // Check file size
      const stats = fs.statSync(inputPath);
      if (stats.size === 0) {
        return reject(new Error('Input file is empty'));
      }

      console.log(`Converting audio from ${inputPath} to ${outputPath}`);
      console.log(`Input file size: ${stats.size} bytes`);
      
      // Try different approaches for WebM conversion
      const command = ffmpeg(inputPath)
        .inputOptions([
          '-f webm', // Explicitly specify input format
          '-i', inputPath // Explicitly specify input file
        ])
        .toFormat('mp3')
        .audioBitrate(128)
        .audioChannels(1) // Mono for better transcription
        .audioFrequency(16000) // 16kHz for optimal transcription
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Audio conversion completed');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('Audio conversion error:', error);
          
          // If the first approach fails, try without explicit format specification
          if (error.message.includes('Invalid data found') || error.message.includes('Error opening input file')) {
            console.log('Trying alternative conversion approach...');
            
            ffmpeg(inputPath)
              .toFormat('mp3')
              .audioBitrate(128)
              .audioChannels(1)
              .audioFrequency(16000)
              .on('start', (commandLine) => {
                console.log('Alternative FFmpeg command:', commandLine);
              })
              .on('end', () => {
                console.log('Alternative audio conversion completed');
                resolve(outputPath);
              })
              .on('error', (altError) => {
                console.error('Alternative conversion also failed:', altError);
                reject(new Error(`Audio conversion failed: ${error.message}. Alternative approach also failed: ${altError.message}`));
              })
              .save(outputPath);
          } else {
            reject(error);
          }
        })
        .save(outputPath);
    });
  }

  // Enhanced audio processing with better error handling
  async enhanceAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(inputPath)) {
        return reject(new Error(`Input file does not exist: ${inputPath}`));
      }

      console.log(`Enhancing audio from ${inputPath} to ${outputPath}`);
      
      const command = ffmpeg(inputPath)
        .audioFilters([
          'highpass=f=200', // Remove low frequency noise
          'lowpass=f=3000', // Remove high frequency noise
          'volume=1.5', // Increase volume
          'anlmdn=s=7:p=0.002:r=0.01' // Noise reduction
        ])
        .toFormat('mp3')
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(16000);

      command
        .on('start', (commandLine) => {
          console.log('FFmpeg enhancement command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Enhancement: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Audio enhancement completed');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('Audio enhancement error:', error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  // Transcribe audio using OpenAI Whisper
  async transcribeAudio(audioPath, options = {}) {
    try {
      console.log('Starting audio transcription...');
      
      // Check if file exists and has content
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file does not exist: ${audioPath}`);
      }

      const stats = fs.statSync(audioPath);
      if (stats.size === 0) {
        throw new Error('Audio file is empty');
      }

      console.log(`Audio file size: ${stats.size} bytes`);
      
      const audioFile = fs.createReadStream(audioPath);
      
      const transcriptionOptions = {
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"],
        language: options.language || "en",
        prompt: options.prompt || "This is a recording that may contain technical terms, names, and various topics.",
        temperature: options.temperature || 0.2
      };

      const transcript = await this.openai.audio.transcriptions.create(transcriptionOptions);
      
      console.log('Transcription completed successfully');
      return {
        success: true,
        text: transcript.text,
        language: transcript.language,
        duration: transcript.duration,
        words: transcript.words || [],
        segments: transcript.segments || []
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Enhance transcription text using GPT
  async enhanceTranscription(transcript, options = {}) {
    try {
      if (!transcript || transcript.trim().length === 0) {
        return { success: false, error: 'Empty transcript' };
      }

      const prompt = `Please enhance the following transcription by:
1. Fixing grammar and punctuation
2. Capitalizing proper nouns
3. Adding paragraph breaks where appropriate
4. Maintaining the original meaning and tone

Transcription: "${transcript}"

Enhanced version:`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that enhances transcriptions while maintaining accuracy and natural flow."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const enhancedText = completion.choices[0].message.content.trim();
      
      return {
        success: true,
        enhancedText: enhancedText,
        originalText: transcript
      };
    } catch (error) {
      console.error('Transcription enhancement error:', error);
      return {
        success: false,
        error: error.message,
        originalText: transcript
      };
    }
  }

  // Generate summary using GPT
  async generateSummary(transcript, options = {}) {
    try {
      if (!transcript || transcript.trim().length === 0) {
        return { success: false, error: 'Empty transcript' };
      }

      const prompt = `Please provide a concise summary of the following transcription:

"${transcript}"

Summary:`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise, accurate summaries of transcriptions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      const summary = completion.choices[0].message.content.trim();
      
      return {
        success: true,
        summary: summary
      };
    } catch (error) {
      console.error('Summary generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Main processing pipeline with better error handling
  async processAudio(audioPath, noteId, options = {}) {
    try {
      console.log(`Starting audio processing for note ${noteId}`);
      console.log(`Input audio path: ${audioPath}`);
      
      // Check if input file exists
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file does not exist: ${audioPath}`);
      }

      const tempDir = path.join(this.tempDir, noteId);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      let processedAudioPath = audioPath;
      const fileExtension = path.extname(audioPath).toLowerCase();

      // Step 1: Convert audio format if needed
      if (fileExtension === '.webm' && this.ffmpegAvailable !== false) {
        try {
          const mp3Path = path.join(tempDir, 'converted.mp3');
          processedAudioPath = await this.convertAudioFormat(audioPath, mp3Path);
          console.log(`Successfully converted to: ${processedAudioPath}`);
        } catch (conversionError) {
          console.warn('Audio conversion failed, trying direct transcription:', conversionError.message);
          // Don't set processedAudioPath to audioPath for WebM - let it fail and use SimpleAudioProcessor
          throw new Error(`WebM conversion failed: ${conversionError.message}`);
        }
      }

      // Step 2: Enhance audio quality (skip if conversion failed)
      let enhancedAudioPath = processedAudioPath;
      if (this.ffmpegAvailable !== false && processedAudioPath !== audioPath) {
        try {
          const enhancedPath = path.join(tempDir, 'enhanced.mp3');
          enhancedAudioPath = await this.enhanceAudio(processedAudioPath, enhancedPath);
          console.log(`Successfully enhanced to: ${enhancedAudioPath}`);
        } catch (enhancementError) {
          console.warn('Audio enhancement failed, using converted file:', enhancementError.message);
          enhancedAudioPath = processedAudioPath;
        }
      }

      // Step 3: Transcribe audio
      const transcriptionResult = await this.transcribeAudio(enhancedAudioPath, options);
      
      if (!transcriptionResult.success) {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      }

      // Step 4: Enhance transcription text
      const enhancementResult = await this.enhanceTranscription(transcriptionResult.text, options);
      
      // Step 5: Generate summary
      const summaryResult = await this.generateSummary(
        enhancementResult.success ? enhancementResult.enhancedText : transcriptionResult.text,
        options
      );

      // Clean up temporary files
      this.cleanupTempFiles(tempDir);

      return {
        success: true,
        transcription: enhancementResult.success ? enhancementResult.enhancedText : transcriptionResult.text,
        originalTranscription: transcriptionResult.text,
        summary: summaryResult.success ? summaryResult.summary : null,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        words: transcriptionResult.words,
        segments: transcriptionResult.segments,
        metadata: {
          audioFormat: fileExtension,
          processingSteps: ['conversion', 'enhancement', 'transcription', 'enhancement', 'summary'],
          ffmpegAvailable: this.ffmpegAvailable,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Audio processing error:', error);
      return {
        success: false,
        error: error.message,
        noteId: noteId
      };
    }
  }

  // Clean up temporary files
  cleanupTempFiles(tempDir) {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temp directory: ${tempDir}`);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  // Get audio file information
  async getAudioInfo(audioPath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(audioPath)) {
        return reject(new Error(`Audio file does not exist: ${audioPath}`));
      }

      ffmpeg.ffprobe(audioPath, (error, metadata) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            audioStream: metadata.streams.find(stream => stream.codec_type === 'audio')
          });
        }
      });
    });
  }
}

module.exports = AudioProcessor; 