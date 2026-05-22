import Sidebar from '../components/Sidebar';

export default function Flashcards() {
  return (
    <>
      <Sidebar />
      <div className="bg-gray-50 min-h-screen ml-72">
        <div className="flex items-center justify-center p-4 h-full">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex flex-col items-center">
            <div className="bg-gray-100 text-gray-600 rounded-full p-4 mb-4">
              <span className="material-icons text-3xl">style</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Flashcards</h1>
            
            <div className="w-full space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h3 className="font-semibold text-gray-900 mb-4">Question</h3>
                <p className="text-gray-700 text-lg">What is the capital of France?</p>
              </div>
              
              <div className="flex gap-2">
                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition mb-2">Reveal Answer</button>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 transition">Next Card</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 