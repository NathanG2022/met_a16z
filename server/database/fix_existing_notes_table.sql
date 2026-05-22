-- Fix existing notes table and add transcription fields
-- This script handles existing tables and policies safely

-- First, let's check what exists
DO $$
BEGIN
    RAISE NOTICE 'Checking existing notes table structure...';
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

-- Recreate policies with IF NOT EXISTS equivalent
DO $$
BEGIN
    -- Create policy for users to only see their own notes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notes' 
        AND policyname = 'Users can view own notes'
    ) THEN
        CREATE POLICY "Users can view own notes" ON notes
        FOR SELECT USING (auth.uid()::text = user_id);
    END IF;

    -- Create policy for users to insert their own notes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notes' 
        AND policyname = 'Users can insert own notes'
    ) THEN
        CREATE POLICY "Users can insert own notes" ON notes
        FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;

    -- Create policy for users to update their own notes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notes' 
        AND policyname = 'Users can update own notes'
    ) THEN
        CREATE POLICY "Users can update own notes" ON notes
        FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;

    -- Create policy for users to delete their own notes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notes' 
        AND policyname = 'Users can delete own notes'
    ) THEN
        CREATE POLICY "Users can delete own notes" ON notes
        FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- Add new columns for transcription functionality (safe to run multiple times)
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS transcription_confidence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transcription_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS audio_duration NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transcription_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS segment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for transcription_status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notes_transcription_status_check'
    ) THEN
        ALTER TABLE notes 
        ADD CONSTRAINT notes_transcription_status_check 
        CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
END $$;

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

-- Create indexes for better query performance (safe to run multiple times)
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

-- Create or replace functions (safe to run multiple times)
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

-- Create or replace trigger (safe to run multiple times)
DROP TRIGGER IF EXISTS update_processing_timestamps_trigger ON notes;
CREATE TRIGGER update_processing_timestamps_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_processing_timestamps();

-- Create or replace word count function
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

-- Create or replace word count update function
CREATE OR REPLACE FUNCTION update_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = calculate_word_count(NEW.transcript);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace word count trigger (safe to run multiple times)
DROP TRIGGER IF EXISTS update_word_count_trigger ON notes;
CREATE TRIGGER update_word_count_trigger
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_word_count();

-- Update existing records with word count
UPDATE notes 
SET word_count = calculate_word_count(transcript)
WHERE transcript IS NOT NULL AND transcript != '';

-- Create or replace view for transcription statistics
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

-- Create or replace transcription quality function
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

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated notes table with transcription fields!';
    RAISE NOTICE 'New columns added: transcription_confidence, transcription_language, audio_duration, transcription_status, metadata, word_count, segment_count, processing_started_at, processing_completed_at';
    RAISE NOTICE 'Functions created: calculate_word_count, update_word_count, update_processing_timestamps, get_transcription_quality';
    RAISE NOTICE 'View created: transcription_stats';
    RAISE NOTICE 'Triggers created: update_word_count_trigger, update_processing_timestamps_trigger';
END $$; 