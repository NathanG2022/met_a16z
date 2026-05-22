-- Migration 001: Add transcription-related fields to notes table
-- Date: 2024-01-XX
-- Description: Add fields for enhanced transcription support

-- Add new columns for transcription functionality
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS transcription_confidence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transcription_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS audio_duration NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS segment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE;

-- Add comments to document the new fields
COMMENT ON COLUMN notes.transcription_confidence IS 'Confidence score of the transcription (0-1)';
COMMENT ON COLUMN notes.transcription_language IS 'Language code of the transcription (e.g., en, es, fr)';
COMMENT ON COLUMN notes.audio_duration IS 'Duration of audio file in seconds';
COMMENT ON COLUMN notes.transcription_status IS 'Status of transcription processing';
COMMENT ON COLUMN notes.metadata IS 'Additional metadata about the note (JSON format)';
COMMENT ON COLUMN notes.word_count IS 'Number of words in the transcription';
COMMENT ON COLUMN notes.segment_count IS 'Number of segments in the transcription';
COMMENT ON COLUMN notes.processing_started_at IS 'Timestamp when processing started';
COMMENT ON COLUMN notes.processing_completed_at IS 'Timestamp when processing completed';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_transcription_status ON notes(transcription_status);
CREATE INDEX IF NOT EXISTS idx_notes_transcription_language ON notes(transcription_language);
CREATE INDEX IF NOT EXISTS idx_notes_processing_started_at ON notes(processing_started_at);
CREATE INDEX IF NOT EXISTS idx_notes_metadata_gin ON notes USING GIN (metadata);

-- Update existing records to set default values
UPDATE notes 
SET 
  transcription_status = CASE 
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'processing' THEN 'processing'
    ELSE 'pending'
  END,
  transcription_language = 'en',
  metadata = COALESCE(metadata, '{}'::jsonb)
WHERE transcription_status IS NULL;

-- Create a function to update processing timestamps
CREATE OR REPLACE FUNCTION update_processing_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set processing_started_at when status changes to processing
  IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
    NEW.processing_started_at = NOW();
  END IF;
  
  -- Set processing_completed_at when status changes to completed or failed
  IF (NEW.status = 'completed' OR NEW.status = 'failed') AND 
     (OLD.status = 'pending' OR OLD.status = 'processing') THEN
    NEW.processing_completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update processing timestamps
DROP TRIGGER IF EXISTS update_processing_timestamps_trigger ON notes;
CREATE TRIGGER update_processing_timestamps_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_processing_timestamps();

-- Create a function to calculate word count from transcript
CREATE OR REPLACE FUNCTION calculate_word_count(transcript_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF transcript_text IS NULL OR transcript_text = '' THEN
    RETURN 0;
  END IF;
  
  -- Split by whitespace and count non-empty words
  RETURN array_length(
    array_remove(
      string_to_array(trim(transcript_text), ' '),
      ''
    ),
    1
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to update word count when transcript changes
CREATE OR REPLACE FUNCTION update_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = calculate_word_count(NEW.transcript);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update word count
DROP TRIGGER IF EXISTS update_word_count_trigger ON notes;
CREATE TRIGGER update_word_count_trigger
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_word_count();

-- Update existing records with word count
UPDATE notes 
SET word_count = calculate_word_count(transcript)
WHERE transcript IS NOT NULL AND transcript != '';

-- Create a view for transcription statistics
CREATE OR REPLACE VIEW transcription_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notes,
  COUNT(CASE WHEN transcription_status = 'completed' THEN 1 END) as completed_transcriptions,
  COUNT(CASE WHEN transcription_status = 'failed' THEN 1 END) as failed_transcriptions,
  COUNT(CASE WHEN transcription_status = 'processing' THEN 1 END) as processing_transcriptions,
  AVG(transcription_confidence) as avg_confidence,
  SUM(word_count) as total_words,
  AVG(audio_duration) as avg_duration
FROM notes 
WHERE type = 'audio'
GROUP BY user_id;

-- Grant permissions on the view
GRANT SELECT ON transcription_stats TO authenticated;

-- Create a function to get transcription quality metrics
CREATE OR REPLACE FUNCTION get_transcription_quality(note_id UUID)
RETURNS TABLE(
  quality_score NUMERIC,
  confidence_level TEXT,
  word_count INTEGER,
  duration NUMERIC,
  language TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(n.transcription_confidence, 0) as quality_score,
    CASE 
      WHEN n.transcription_confidence >= 0.9 THEN 'Excellent'
      WHEN n.transcription_confidence >= 0.8 THEN 'Good'
      WHEN n.transcription_confidence >= 0.7 THEN 'Fair'
      ELSE 'Poor'
    END as confidence_level,
    COALESCE(n.word_count, 0) as word_count,
    COALESCE(n.audio_duration, 0) as duration,
    COALESCE(n.transcription_language, 'en') as language
  FROM notes n
  WHERE n.id = note_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_transcription_quality(UUID) TO authenticated; 