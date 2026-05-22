import Sidebar from '../components/Sidebar';

export default function Settings() {
  return (
    <>
      <Sidebar />
      <div className="bg-gray-50 min-h-screen ml-72">
        <div className="flex items-center justify-center p-4 h-full">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex flex-col items-center">
            <div className="bg-gray-100 text-gray-600 rounded-full p-4 mb-4">
              <span className="material-icons text-3xl">settings</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
            
            <div className="w-full space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input 
                  id="user-name"
                  name="user-name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" 
                  placeholder="Your name" 
                />
              </div>
              
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  id="user-email"
                  name="user-email"
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400" 
                  placeholder="Your email" 
                />
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" id="newsletter-sub" name="newsletter-sub" className="accent-gray-500" />
                <label htmlFor="newsletter-sub" className="ml-2 text-sm text-gray-700">Subscribe to newsletter</label>
              </div>
              
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 