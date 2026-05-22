const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

class SimpleAudioProcessor {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Transcribe audio directly using OpenAI Whisper (no preprocessing)
  async transcribeAudio(audioPath, options = {}) {
    try {
      console.log('Starting direct audio transcription...');
      
      // Check if file exists and has content
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file does not exist: ${audioPath}`);
      }

      const stats = fs.statSync(audioPath);
      if (stats.size === 0) {
        throw new Error('Audio file is empty');
      }

      console.log(`Audio file size: ${stats.size} bytes`);
      console.log(`Audio file path: ${audioPath}`);
      
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

  // Simple processing pipeline (no audio preprocessing)
  async processAudio(audioPath, noteId, options = {}) {
    try {
      console.log(`Starting simple audio processing for note ${noteId}`);
      console.log(`Input audio path: ${audioPath}`);
      
      // Check if input file exists
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file does not exist: ${audioPath}`);
      }

      // Step 1: Transcribe audio directly
      const transcriptionResult = await this.transcribeAudio(audioPath, options);
      
      if (!transcriptionResult.success) {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      }

      // Step 2: Enhance transcription text
      const enhancementResult = await this.enhanceTranscription(transcriptionResult.text, options);
      
      // Step 3: Generate summary
      const summaryResult = await this.generateSummary(
        enhancementResult.success ? enhancementResult.enhancedText : transcriptionResult.text,
        options
      );

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
          audioFormat: path.extname(audioPath),
          processingSteps: ['direct_transcription', 'enhancement', 'summary'],
          ffmpegUsed: false,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Simple audio processing error:', error);
      return {
        success: false,
        error: error.message,
        noteId: noteId
      };
    }
  }
}

module.exports = SimpleAudioProcessor; 