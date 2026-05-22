-- Rollback Migration 001: Remove transcription-related fields from notes table
-- Date: 2024-01-XX
-- Description: Rollback changes made in migration_001_add_transcription_fields.sql

-- Drop triggers first
DROP TRIGGER IF EXISTS update_processing_timestamps_trigger ON notes;
DROP TRIGGER IF EXISTS update_word_count_trigger ON notes;

-- Drop functions
DROP FUNCTION IF EXISTS update_processing_timestamps();
DROP FUNCTION IF EXISTS update_word_count();
DROP FUNCTION IF EXISTS calculate_word_count(TEXT);
DROP FUNCTION IF EXISTS get_transcription_quality(UUID);

-- Drop view
DROP VIEW IF EXISTS transcription_stats;

-- Drop indexes
DROP INDEX IF EXISTS idx_notes_transcription_status;
DROP INDEX IF EXISTS idx_notes_transcription_language;
DROP INDEX IF EXISTS idx_notes_processing_started_at;
DROP INDEX IF EXISTS idx_notes_metadata_gin;

-- Remove columns
ALTER TABLE notes 
DROP COLUMN IF EXISTS transcription_confidence,
DROP COLUMN IF EXISTS transcription_language,
DROP COLUMN IF EXISTS audio_duration,
DROP COLUMN IF EXISTS transcription_status,
DROP COLUMN IF EXISTS metadata,
DROP COLUMN IF EXISTS word_count,
DROP COLUMN IF EXISTS segment_count,
DROP COLUMN IF EXISTS processing_started_at,
DROP COLUMN IF EXISTS processing_completed_at; 