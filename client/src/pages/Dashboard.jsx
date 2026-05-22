import { useState, useEffect } from 'react';
import NoteCard from '../components/NoteCard';
import LoadingScreen from '../components/LoadingScreen';
import Sidebar from '../components/Sidebar';
import RecordingView from './RecordingView';
import UploadModal from '../components/UploadModal';
import { getAuthToken } from '../lib/supabase';
import addNoteIcon from '../assets/note.svg';

const authFetch = async (input, init = {}) => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
};

export default function Dashboard() {
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [showRecordingView, setShowRecordingView] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalType, setUploadModalType] = useState('audio');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Poll while any note is still processing so the dashboard reflects real status.
  useEffect(() => {
    const hasPending = notes.some(n => n.status === 'pending' || n.status === 'processing');
    if (!hasPending) return;
    const interval = setInterval(fetchNotes, 4000);
    return () => clearInterval(interval);
  }, [notes]);

  const handleStartRecording = () => setShowRecordingView(true);

  const handleRecordingComplete = async (recordingData) => {
    setShowRecordingView(false);
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('audio', recordingData.audioBlob, 'recording.webm');
      formData.append('transcription', recordingData.transcription || '');
      formData.append('duration', String(recordingData.duration ?? 0));
      formData.append('timestamp', recordingData.timestamp);

      const res = await authFetch('/api/notes/upload/audio', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Recording upload failed');
      }

      const result = await res.json();
      setNotes(prev => [result, ...prev]);
    } catch (err) {
      console.error('Recording upload error:', err);
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExitRecording = () => setShowRecordingView(false);

  const handleOpenUploadModal = (type) => {
    setUploadModalType(type);
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => setShowUploadModal(false);

  const handleUploadFile = async (file) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (uploadModalType === 'document') {
        formData.append('document', file);
        const res = await authFetch('/api/notes/upload/pdf', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Document upload failed');
        const result = await res.json();
        setNotes(prev => [result, ...prev]);
      }
    } catch (err) {
      setUploadError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);
    setIsUploading(true);
    try {
      const res = await authFetch('/api/notes/upload/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeLink })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'YouTube upload failed');
      }
      const result = await res.json();
      setNotes(prev => [result, ...prev]);
      setShowYoutubeModal(false);
      setYoutubeLink('');
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const minutes = notes.reduce((sum, note) => sum + (Number(note.duration) || 0), 0);
  const filteredNotes = filterStatus === 'all'
    ? notes
    : notes.filter(note => note.status === filterStatus);

  if (showRecordingView) {
    return (
      <RecordingView
        onRecordingComplete={handleRecordingComplete}
        onExit={handleExitRecording}
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar notes={notes} minutes={minutes} onWidthChange={setSidebarWidth} />
      <div
        className="flex-1 bg-gray-50 transition-all duration-300 ease-in-out flex flex-col"
        style={{ marginLeft: isMobile ? '0px' : `${sidebarWidth}px` }}
      >
        <div className="flex-1 p-8">
          <div className="p-8 relative overflow-hidden">
            <div className="flex flex-col mb-8 relative">
              <h1 className="text-5xl font-extrabold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-500 text-lg mb-2">Manage and view your processed notes</p>
              <button
                className="absolute top-0 right-0 px-5 py-2 rounded-lg bg-gray-900 text-white font-semibold shadow-lg hover:bg-gray-800 transition text-base z-10"
              >
                <img src={addNoteIcon} alt="Add" className="w-5 h-5 mr-2 inline" />
                New Note
              </button>
            </div>
            {isUploading && <LoadingScreen message="Uploading…" />}
            {uploadError && <div className="mb-4 text-gray-700 bg-gray-100 p-3 rounded-lg">{uploadError}</div>}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <button
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition"
                onClick={handleStartRecording}
              >
                <span className="material-icons">mic</span>
                Record Audio
              </button>
              <button
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                onClick={() => setShowYoutubeModal(true)}
              >
                <span className="material-icons">ondemand_video</span>
                YouTube video
              </button>
              <button
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                onClick={() => handleOpenUploadModal('document')}
              >
                <span className="material-icons">description</span>
                Document upload
              </button>
            </div>
            <div className="sticky top-0 z-10 pb-4 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-5xl font-extrabold text-gray-900 mb-2">My Notes</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm pr-8"
                  >
                    <option value="all">All Notes</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
            {showYoutubeModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Paste YouTube Link</h2>
                  <form onSubmit={handleYoutubeSubmit}>
                    <input
                      type="url"
                      id="youtube-link"
                      name="youtube-link"
                      className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeLink}
                      onChange={e => setYoutubeLink(e.target.value)}
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <button type="button" className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setShowYoutubeModal(false)}>Cancel</button>
                      <button type="submit" className="px-4 py-2 rounded bg-gray-900 text-white font-semibold hover:bg-gray-800">Submit</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <UploadModal
              isOpen={showUploadModal}
              onClose={handleCloseUploadModal}
              onUpload={handleUploadFile}
              uploadType={uploadModalType}
            />
            <div className="flex flex-col gap-8 mt-8">
              {loading && <div className="text-gray-500">Loading notes...</div>}
              {error && <div className="text-gray-700 bg-gray-100 p-3 rounded-lg">{error}</div>}
              {!loading && !error && filteredNotes.length === 0 && (
                <div className="text-gray-400">
                  {notes.length === 0 ? 'No notes found.' : `No ${filterStatus} notes found.`}
                </div>
              )}
              {filteredNotes.map(note => (
                <div key={note.id} className="rounded-2xl shadow border border-gray-200 bg-white hover:shadow-lg transition-all duration-200">
                  <NoteCard note={note} onDelete={handleDeleteNote} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <footer className="text-center text-xs text-gray-400 py-4 px-8 border-t border-gray-200 bg-white">
          &copy; {new Date().getFullYear()} Noteus &mdash; All rights reserved.
        </footer>
      </div>
    </div>
  );
}
