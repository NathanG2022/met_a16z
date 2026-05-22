const { createClient } = require('@supabase/supabase-js');

class SupabaseDatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Create a new note
  async createNote(noteData) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  // Get all notes for a user
  async getNotesByUserId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  // Get a single note by ID
  async getNoteById(noteId) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  }

  // Update a note
  async updateNote(noteId, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Delete a note
  async deleteNote(noteId) {
    try {
      const { error } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Update processing steps
  async updateProcessingSteps(noteId, steps) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .update({ processing_steps: steps })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating processing steps:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(noteId, status, error = null) {
    try {
      const updateData = { status };
      if (error) updateData.error = error;

      const { data, error: updateError } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  // Update transcription status
  async updateTranscriptionStatus(noteId, transcriptionStatus, confidence = null, language = null) {
    try {
      const updateData = { transcription_status: transcriptionStatus };
      
      if (confidence !== null) {
        updateData.transcription_confidence = confidence;
      }
      
      if (language !== null) {
        updateData.transcription_language = language;
      }

      const { data, error } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transcription status:', error);
      throw error;
    }
  }

  // Update transcription data
  async updateTranscription(noteId, transcriptionData) {
    try {
      const updateData = {
        transcript: transcriptionData.transcript,
        transcription_status: 'completed',
        transcription_confidence: transcriptionData.confidence || 0,
        transcription_language: transcriptionData.language || 'en',
        word_count: transcriptionData.wordCount || 0,
        segment_count: transcriptionData.segmentCount || 0,
        audio_duration: transcriptionData.duration || 0
      };

      if (transcriptionData.metadata) {
        updateData.metadata = transcriptionData.metadata;
      }

      const { data, error } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transcription:', error);
      throw error;
    }
  }

  // Get notes by status
  async getNotesByStatus(userId, status) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notes by status:', error);
      throw error;
    }
  }

  // Get notes by transcription status
  async getNotesByTranscriptionStatus(userId, transcriptionStatus) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('transcription_status', transcriptionStatus)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notes by transcription status:', error);
      throw error;
    }
  }

  // Get transcription statistics for a user
  async getTranscriptionStats(userId) {
    try {
      const { data, error } = await this.supabase
        .from('transcription_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transcription stats:', error);
      throw error;
    }
  }

  // Get transcription quality metrics
  async getTranscriptionQuality(noteId) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_transcription_quality', { note_id: noteId })
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transcription quality:', error);
      throw error;
    }
  }

  // Search notes by transcript content
  async searchNotesByTranscript(userId, searchTerm) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .ilike('transcript', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching notes by transcript:', error);
      throw error;
    }
  }

  // Get notes with transcription errors
  async getNotesWithTranscriptionErrors(userId) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('transcription_status', 'failed')
        .not('error', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notes with transcription errors:', error);
      throw error;
    }
  }

  // Update metadata for a note
  async updateMetadata(noteId, metadata) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .update({ metadata })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  // Get processing statistics
  async getProcessingStats(userId) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select(`
          status,
          transcription_status,
          processing_started_at,
          processing_completed_at,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching processing stats:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseDatabaseService(); 