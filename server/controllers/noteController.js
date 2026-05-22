const fs = require('fs');
const supabaseDb = require('../services/supabaseDb');
const supabaseStorage = require('../services/supabaseStorage');
const youtubeProcessor = require('../services/youtubeProcessor');
const AudioProcessor = require('../services/audioProcessor');
const SimpleAudioProcessor = require('../services/simpleAudioProcessor');
const { analyzeTranscript } = require('../services/textAnalysisClient');

exports.getAllNotes = async (req, res) => {
  try {
    const notes = await supabaseDb.getNotesByUserId(req.user.id);
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await supabaseDb.getNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const note = await supabaseDb.createNote({ ...req.body, user_id: req.user.id });
    res.status(201).json(note);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const note = await supabaseDb.updateNote(req.params.id, req.body);
    res.json(note);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await supabaseDb.getNoteById(req.params.id);
    if (note) {
      if (note.audio_url) {
        try { await supabaseStorage.deleteFile(note.audio_url); } catch (e) { console.error('audio delete:', e); }
      }
      if (note.file_url) {
        try { await supabaseStorage.deleteFile(note.file_url); } catch (e) { console.error('file delete:', e); }
      }
    }
    await supabaseDb.deleteNote(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(400).json({ error: err.message });
  }
};

// Pick an audio processor: prefer FFmpeg pipeline, fall back to direct Whisper.
function buildAudioProcessor() {
  try {
    return new AudioProcessor();
  } catch (err) {
    console.log('FFmpeg unavailable, using SimpleAudioProcessor:', err.message);
    return new SimpleAudioProcessor();
  }
}

// Background: transcribe → analyze → persist. Errors are caught and saved to the note.
async function runAudioPipeline({ localPath, originalName, noteId, userId, clientTranscription, duration }) {
  let processingResult;
  try {
    const processor = buildAudioProcessor();
    processingResult = await processor.processAudio(localPath, noteId, {
      language: 'en',
      prompt: 'This is an audio recording that may contain various topics, names, and technical terms.'
    });
  } catch (err) {
    processingResult = { success: false, error: err.message };
  }

  // Always try to upload the original recording so the user can replay it.
  let publicUrl = null;
  try {
    const uploadResult = await supabaseStorage.uploadAudioFile(localPath, originalName);
    publicUrl = uploadResult.publicUrl;
  } catch (err) {
    console.error('Audio upload failed:', err);
  }

  // Choose the best transcript we have: server-side > client-side fallback.
  const finalTranscript = processingResult.success && processingResult.transcription
    ? processingResult.transcription
    : (clientTranscription || '');

  // Analyze the transcript for speaking-coach feedback.
  let analysis = null;
  if (finalTranscript.trim()) {
    const analysisResult = await analyzeTranscript(finalTranscript, userId);
    if (analysisResult.success) {
      analysis = analysisResult.analysis;
    } else {
      console.warn(`Analysis skipped for note ${noteId}: ${analysisResult.error}`);
    }
  }

  const update = {
    status: processingResult.success || finalTranscript ? 'completed' : 'failed',
    transcript: finalTranscript,
    summary: processingResult.summary || null,
    duration: processingResult.duration || (duration ? parseInt(duration, 10) : null),
    metadata: {
      ...(processingResult.metadata || {}),
      language: processingResult.language,
      wordCount: processingResult.words?.length || 0,
      segmentCount: processingResult.segments?.length || 0,
      processingError: processingResult.success ? null : processingResult.error,
      analysis,
      timestamp: new Date().toISOString()
    }
  };
  if (publicUrl) update.file_url = publicUrl;
  if (!processingResult.success) update.error = processingResult.error;

  await supabaseDb.updateNote(noteId, update);

  // Cleanup local file regardless.
  try { fs.unlinkSync(localPath); } catch (e) { /* already gone */ }
}

exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({ error: 'File was not saved properly' });
    }
    if (fs.statSync(req.file.path).size === 0) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ error: 'Uploaded file is empty' });
    }

    const userId = req.user.id;
    const { transcription: clientTranscription, duration, timestamp } = req.body;

    // Create the note up front with no file_url — we'll fill it in once the
    // file is uploaded to storage. Returning a server-local path was leaking
    // an unusable URL to the client.
    const note = await supabaseDb.createNote({
      user_id: userId,
      type: 'audio',
      size: req.file.size / (1024 * 1024),
      status: 'processing',
      transcript: clientTranscription || '',
      duration: duration ? parseInt(duration, 10) : null,
      created_at: timestamp || new Date().toISOString()
    });

    // Fire-and-forget the heavy lifting; errors are persisted on the note.
    runAudioPipeline({
      localPath: req.file.path,
      originalName: req.file.originalname,
      noteId: note.id,
      userId,
      clientTranscription,
      duration
    }).catch(async (err) => {
      console.error('Audio pipeline crashed:', err);
      try {
        await supabaseDb.updateNote(note.id, { status: 'failed', error: err.message });
      } catch (_) {}
    });

    res.status(201).json({ ...note, message: 'Audio processing started' });
  } catch (err) {
    console.error('Error uploading audio:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });

    const uploadResult = await supabaseStorage.uploadFile(
      req.file.path,
      req.file.originalname,
      'application/pdf'
    );

    const note = await supabaseDb.createNote({
      user_id: req.user.id,
      type: 'pdf',
      file_url: uploadResult.publicUrl,
      size: uploadResult.size / (1024 * 1024),
      status: 'completed'
    });

    try { fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(201).json(note);
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.uploadYoutube = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No YouTube URL provided' });

    const validation = await youtubeProcessor.validateUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const note = await supabaseDb.createNote({
      user_id: req.user.id,
      type: 'youtube',
      video_url: url,
      title: validation.title,
      duration: validation.duration,
      thumbnail: validation.thumbnail,
      status: 'pending',
      processing_steps: {
        download: false,
        audioExtraction: false,
        transcription: false,
        summary: false
      }
    });

    youtubeProcessor.processYoutubeVideo(url, note.id, req.user.id)
      .then(() => console.log(`YouTube processing completed for note ${note.id}`))
      .catch(err => console.error(`YouTube processing failed for note ${note.id}:`, err));

    res.status(201).json({ ...note, message: 'YouTube video processing started' });
  } catch (err) {
    console.error('Error uploading YouTube video:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getYoutubeStatus = async (req, res) => {
  try {
    const note = await supabaseDb.getNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({
      id: note.id,
      status: note.status,
      processingSteps: note.processing_steps,
      error: note.error
    });
  } catch (err) {
    console.error('Error getting YouTube status:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

exports.retryYoutubeProcessing = async (req, res) => {
  try {
    const note = await supabaseDb.getNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.type !== 'youtube') return res.status(400).json({ error: 'Note is not a YouTube video' });
    if (note.status !== 'failed') return res.status(400).json({ error: 'Note is not in failed status' });

    await supabaseDb.updateStatus(req.params.id, 'pending');
    youtubeProcessor.processYoutubeVideo(note.video_url, req.params.id, req.user.id)
      .catch(err => console.error(`Retry failed for note ${req.params.id}:`, err));

    res.json({ message: 'YouTube processing retry started' });
  } catch (err) {
    console.error('Error retrying YouTube processing:', err);
    res.status(500).json({ error: 'Failed to retry processing' });
  }
};
