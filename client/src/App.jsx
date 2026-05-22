import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import ChatBot from './pages/ChatBot';
import Podcast from './pages/Podcast';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Transcript from './pages/Transcript';
import Settings from './pages/Settings';
import Subscriptions from './pages/Subscriptions';
import RecordingDemo from './pages/RecordingDemo';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignIn, SignUp } from './components/Auth';
import AuthCallback from './components/AuthCallback';
import LoadingScreen from './components/LoadingScreen';
import './styles/RecordingView.css';
import './styles/FileUpload.css';

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return showSignUp ? (
      <SignUp onSuccess={() => setShowSignUp(false)} onSwitchToSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignIn onSuccess={() => {}} onSwitchToSignUp={() => setShowSignUp(true)} />
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chatbot" element={<ChatBot />} />
        <Route path="/podcast" element={<Podcast />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/transcript" element={<Transcript />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/recording-demo" element={<RecordingDemo />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
