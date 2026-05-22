import Sidebar from '../components/Sidebar';

export default function Podcast() {
  return (
    <>
      <Sidebar />
      <div className="bg-gray-50 min-h-screen ml-72">
        <div className="flex items-center justify-center p-4 h-full">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex flex-col items-center">
            <div className="bg-gray-100 text-gray-600 rounded-full p-4 mb-4">
              <span className="material-icons text-3xl">podcasts</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Podcast Generator</h1>
            
            <div className="w-full space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Current Episode</h3>
                <p className="text-gray-700 mb-3">Episode 1: Introduction to AI</p>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gray-900 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">2:30 / 6:00</span>
                </div>
                
                <div className="flex gap-2">
                  <button className="bg-gray-900 text-white rounded-full p-2 shadow hover:bg-gray-800 transition">
                    <span className="material-icons">play_arrow</span>
                  </button>
                  <button className="bg-gray-200 text-gray-700 rounded-full p-2 shadow hover:bg-gray-300 transition">
                    <span className="material-icons">pause</span>
                  </button>
                </div>
              </div>
              
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition">Generate New Episode</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 