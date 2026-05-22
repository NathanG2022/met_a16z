import { useState } from 'react';
import RecordingView from './RecordingView';

const RecordingDemo = () => {
  const [showRecording, setShowRecording] = useState(false);
  const [recordingData, setRecordingData] = useState(null);

  const handleStartRecording = () => {
    setShowRecording(true);
  };

  const handleRecordingComplete = (data) => {
    setShowRecording(false);
    setRecordingData(data);
    console.log('Recording completed:', data);
  };

  const handleExitRecording = () => {
    setShowRecording(false);
  };

  if (showRecording) {
    return (
      <RecordingView
        onRecordingComplete={handleRecordingComplete}
        onExit={handleExitRecording}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Audio Recording Demo
          </h1>
          <p className="text-gray-600 mb-8">
            Test the new audio recording functionality with real-time transcription.
          </p>
          
          <button
            onClick={handleStartRecording}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-purple-700 transition"
          >
            Start Recording Demo
          </button>

          {recordingData && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Last Recording:</h3>
              <p className="text-sm text-gray-600">
                Duration: {Math.round(recordingData.duration / 1000)}s
              </p>
              <p className="text-sm text-gray-600">
                Words: {recordingData.transcription.split(/\s+/).length}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {recordingData.transcription.substring(0, 100)}...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingDemo; 