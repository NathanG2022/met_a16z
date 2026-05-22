import Sidebar from '../components/Sidebar';

export default function Quiz() {
  return (
    <>
      <Sidebar />
      <div className="bg-gray-50 min-h-screen ml-72">
        <div className="flex items-center justify-center p-4 h-full">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex flex-col items-center">
            <div className="bg-gray-100 text-gray-600 rounded-full p-4 mb-4">
              <span className="material-icons text-3xl">quiz</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Quiz</h1>
            
            <div className="w-full space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Question 1:</h3>
                <p className="text-gray-700 mb-4">What is the capital of France?</p>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="radio" id="quiz-option-a" name="quiz" className="accent-gray-500" /> 
                    <span className="ml-2 text-gray-700">Option A</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" id="quiz-option-b" name="quiz" className="accent-gray-500" /> 
                    <span className="ml-2 text-gray-700">Option B</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" id="quiz-option-c" name="quiz" className="accent-gray-500" /> 
                    <span className="ml-2 text-gray-700">Option C</span>
                  </label>
                </div>
              </div>
              
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 