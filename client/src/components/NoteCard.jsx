import { useState, useEffect } from 'react';
import { getAuthToken } from '../lib/supabase';

const authFetch = async (input, init = {}) => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  return fetch(input, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` }
  });
};

export default function NoteCard({ note, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(note.status);
  const [processingSteps, setProcessingSteps] = useState(note.processing_steps);
  const [isDeleting, setIsDeleting] = useState(false);

  // Poll YouTube processing status only for YouTube notes that are still working.
  useEffect(() => {
    if (note.type !== 'youtube') return;
    if (note.status !== 'pending' && note.status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const response = await authFetch(`/api/notes/${note.id}/youtube/status`);
        if (response.ok) {
          const statusData = await response.json();
          setProcessingStatus(statusData.status);
          setProcessingSteps(statusData.processingSteps);
          if (statusData.status === 'completed' || statusData.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [note.id, note.type, note.status]);

  const calculateProgress = () => {
    if (!processingSteps) return 0;
    const steps = ['download', 'audioExtraction', 'transcription', 'summary'];
    const completedSteps = steps.filter(step => processingSteps[step]).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await authFetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete note');
      if (onDelete) onDelete(note.id);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const analysis = note.metadata?.analysis;

  return (
    <>
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow p-7 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-lg transition-all duration-200 before:absolute before:top-0 before:left-0 before:bottom-0 before:w-2 before:rounded-l-2xl before:bg-gray-900">
        {note.thumbnail && (
          <img
            src={note.thumbnail}
            alt="thumb"
            className="w-full md:w-28 h-20 rounded-lg object-cover bg-gray-100 flex-shrink-0 mb-4 md:mb-0 z-10"
          />
        )}
        <div className="flex-1 min-w-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
            <div className="font-semibold text-lg text-gray-900 truncate flex items-center gap-2">
              {note.type === 'youtube' && (
                <a
                  href={note.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-600 hover:text-gray-800"
                  title="View on YouTube"
                >
                  <span className="material-icons text-base mr-1">ondemand_video</span>
                  <span className="sr-only">YouTube</span>
                </a>
              )}
              {note.title || note.type}
            </div>
            {processingStatus && (
              <span className={`text-xs px-2 py-1 rounded font-semibold ml-0 md:ml-2 ${getStatusColor(processingStatus)}`}>
                {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
              </span>
            )}
            {note.type === 'youtube' && (processingStatus === 'pending' || processingStatus === 'processing') && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-semibold ml-0 md:ml-2">
                {calculateProgress()}%
              </span>
            )}
          </div>
          <div className="text-gray-500 text-sm mb-2 truncate">
            {note.summary ? note.summary.substring(0, 100) + '…' : 'No summary available.'}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
            <span>{formatDuration(note.duration)}</span>
            <span>•</span>
            <span>{note.type}</span>
            <span>•</span>
            <span>Added {new Date(note.created_at).toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Transcript</span>
            <span className={note.transcript ? 'bg-green-100 text-green-700 text-xs px-2 py-1 rounded' : 'bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded'}>
              {note.transcript ? 'Available' : 'Not Available'}
            </span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Coaching</span>
            <span className={analysis ? 'bg-green-100 text-green-700 text-xs px-2 py-1 rounded' : 'bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded'}>
              {analysis ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
        <div className="flex md:flex-col items-end md:items-end justify-end w-full md:w-auto mt-4 md:mt-0 z-10 gap-2">
          <button
            className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:text-gray-900 transition whitespace-nowrap shadow-sm relative group"
            onClick={() => setShowModal(true)}
            title="View details"
          >
            Details &gt;
          </button>
          <button
            className={`px-4 py-2 rounded-lg border border-red-300 bg-white text-red-600 font-semibold hover:bg-red-50 hover:text-red-700 transition whitespace-nowrap shadow-sm relative group ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete note"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></span>
                Deleting…
              </span>
            ) : (
              <>
                <span className="material-icons text-sm mr-1">delete</span>
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative my-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black text-2xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">{note.title || note.type}</h2>
            <div className="text-gray-500 mb-4">
              {formatDuration(note.duration)} • {note.type} • {new Date(note.created_at).toLocaleString()}
            </div>
            <div className="mb-4">
              <strong>Status:</strong>
              <span className={`ml-2 ${getStatusColor(processingStatus)} px-2 py-1 rounded text-xs font-semibold`}>
                {processingStatus ? processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1) : 'Pending'}
              </span>
            </div>
            {note.type === 'youtube' && processingSteps && (
              <div className="mb-4">
                <strong>Processing Steps:</strong>
                <div className="mt-2 space-y-1">
                  {Object.entries(processingSteps).map(([step, completed]) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-sm capitalize">{step.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4">
              <strong>Transcript:</strong>
              <div className="bg-gray-50 rounded p-2 mt-1 max-h-40 overflow-y-auto text-sm border border-gray-100">
                {note.transcript || <span className="text-gray-400">Not available</span>}
              </div>
            </div>
            <div className="mb-4">
              <strong>Summary:</strong>
              <div className="bg-gray-50 rounded p-2 mt-1 max-h-32 overflow-y-auto text-sm border border-gray-100">
                {note.summary || <span className="text-gray-400">Not available</span>}
              </div>
            </div>

            {analysis && <SpeakingCoachPanel analysis={analysis} />}

            {note.error && (
              <div className="mb-4">
                <strong className="text-red-600">Error:</strong>
                <div className="bg-red-50 rounded p-2 mt-1 text-sm border border-red-100 text-red-700">
                  {note.error}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                className={`px-4 py-2 rounded-lg border border-red-300 bg-white text-red-600 font-semibold hover:bg-red-50 transition ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SpeakingCoachPanel({ analysis }) {
  const ai = analysis.ai_analysis?.ai_suggestions;
  const progress = analysis.progress_comparison;

  return (
    <div className="mb-4 border border-purple-200 bg-purple-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-icons text-purple-700">campaign</span>
        <strong className="text-purple-900">Speaking Coach</strong>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-3">
        <Metric label="Fillers" value={analysis.total_filler_words ?? 0} />
        <Metric label="Words" value={analysis.total_words ?? 0} />
        <Metric label="Unique" value={analysis.unique_words ?? 0} />
        <Metric label="Diversity" value={(analysis.vocabulary_diversity ?? 0).toFixed?.(2) ?? analysis.vocabulary_diversity} />
      </div>

      {analysis.simple_feedback && (
        <div className="text-sm text-gray-800 mb-3 whitespace-pre-line">{analysis.simple_feedback}</div>
      )}

      {ai?.priority_improvement && (
        <div className="text-sm mb-3">
          <strong>Top priority: </strong>{ai.priority_improvement}
        </div>
      )}

      {Array.isArray(ai?.word_replacements) && ai.word_replacements.length > 0 && (
        <div className="mb-3">
          <strong className="text-sm">Word swaps:</strong>
          <ul className="mt-1 space-y-2">
            {ai.word_replacements.slice(0, 5).map((rep, i) => (
              <li key={i} className="text-sm bg-white rounded p-2 border border-purple-100">
                <span className="line-through text-red-600">{rep.original}</span>
                {' → '}
                <span className="text-green-700">{(rep.alternatives || []).join(', ')}</span>
                {rep.reason && <div className="text-xs text-gray-500 mt-1">{rep.reason}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ai?.tone_analysis && (
        <div className="text-sm mb-2">
          <strong>Tone: </strong>{ai.tone_analysis.overall_tone}
          {typeof ai.tone_analysis.confidence_score === 'number' && (
            <> · Confidence {ai.tone_analysis.confidence_score}/10</>
          )}
        </div>
      )}

      {progress && !progress.is_first_session && progress.overall_message && (
        <div className="text-sm text-gray-700 italic">{progress.overall_message}</div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-white rounded p-2 border border-purple-100">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}
