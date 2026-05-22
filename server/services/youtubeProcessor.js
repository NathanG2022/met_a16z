const ytdl = require('ytdl-core');
const YouTubeTranscript = require('youtube-transcript-api');
const ffmpeg = require('fluent-ffmpeg');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const supabaseStorage = require('./supabaseStorage');
const supabaseDb = require('./supabaseDb');
const { analyzeTranscript } = require('./textAnalysisClient');

class YouTubeProcessor {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async validateUrl(url) {
    try {
      const videoId = ytdl.getVideoID(url);
      const info = await ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      });
      return {
        isValid: true,
        videoId,
        title: info.videoDetails.title,
        duration: parseInt(info.videoDetails.lengthSeconds, 10),
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        author: info.videoDetails.author.name
      };
    } catch (error) {
      console.error('Error validating YouTube URL:', error);
      // We still validate the URL shape so the user gets a quick "invalid"
      // signal even when YouTube blocks metadata fetches (common with ytdl-core).
      try {
        const videoId = ytdl.getVideoID(url);
        return {
          isValid: true,
          videoId,
          title: 'YouTube video',
          duration: 0,
          thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
          author: 'Unknown'
        };
      } catch (_) {
        return { isValid: false, error: 'Invalid YouTube URL format' };
      }
    }
  }

  async extractAudio(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('mp3')
        .audioBitrate(128)
        .on('end', () => resolve(audioPath))
        .on('error', reject)
        .save(audioPath);
    });
  }

  // Try the captions API first (cheap, no download). Falls back to Whisper on
  // the downloaded audio if captions are missing.
  async getCaptionsTranscript(videoId) {
    try {
      const client = new YouTubeTranscript();
      const parts = await client.fetchTranscript(videoId);
      if (!parts || parts.length === 0) return null;
      return parts.map(p => p.text).join(' ');
    } catch (err) {
      console.log('Captions unavailable:', err.message);
      return null;
    }
  }

  async whisperTranscribeYoutube(url, noteId) {
    const videoPath = path.join(this.tempDir, `${noteId}_video.mp4`);
    const audioPath = path.join(this.tempDir, `${noteId}_audio.mp3`);

    await new Promise((resolve, reject) => {
      ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })
        .pipe(fs.createWriteStream(videoPath))
        .on('finish', resolve)
        .on('error', reject);
    });

    await this.extractAudio(videoPath, audioPath);
    try { fs.unlinkSync(videoPath); } catch (_) {}

    const transcript = await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: 'en'
    });

    try { fs.unlinkSync(audioPath); } catch (_) {}
    return transcript.text;
  }

  async generateSummary(transcript) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that creates concise summaries of video transcripts.' },
        { role: 'user', content: `Please create a concise summary of the following transcript:\n\n${transcript}` }
      ],
      max_tokens: 500,
      temperature: 0.5
    });
    return completion.choices[0].message.content;
  }

  async processYoutubeVideo(url, noteId, userId) {
    try {
      await supabaseDb.updateStatus(noteId, 'processing');

      const validation = await this.validateUrl(url);
      if (!validation.isValid) throw new Error('Invalid YouTube URL');
      const { videoId } = validation;

      await supabaseDb.updateProcessingSteps(noteId, {
        download: true,
        audioExtraction: false,
        transcription: false,
        summary: false
      });

      // Prefer captions; fall back to downloading audio and running Whisper.
      let transcript = await this.getCaptionsTranscript(videoId);
      if (!transcript) {
        transcript = await this.whisperTranscribeYoutube(url, noteId);
      }
      if (!transcript || !transcript.trim()) {
        throw new Error('Could not retrieve a transcript for this video.');
      }

      await supabaseDb.updateProcessingSteps(noteId, {
        download: true,
        audioExtraction: true,
        transcription: true,
        summary: false
      });

      const summary = await this.generateSummary(transcript);

      // Run the speaking-coach analysis so YouTube notes get the same panel.
      const analysisResult = await analyzeTranscript(transcript, userId);

      await supabaseDb.updateNote(noteId, {
        transcript,
        summary,
        status: 'completed',
        metadata: {
          videoId,
          analysis: analysisResult.success ? analysisResult.analysis : null,
          analysisError: analysisResult.success ? null : analysisResult.error
        }
      });

      await supabaseDb.updateProcessingSteps(noteId, {
        download: true,
        audioExtraction: true,
        transcription: true,
        summary: true
      });

      return { transcript, summary, videoId };
    } catch (error) {
      console.error('Error in YouTube processing pipeline:', error);
      await supabaseDb.updateStatus(noteId, 'failed', error.message);
      throw error;
    }
  }
}

module.exports = new YouTubeProcessor();
