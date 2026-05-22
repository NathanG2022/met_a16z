import Sidebar from '../components/Sidebar';

export default function ChatBot() {
  return (
    <>
      <Sidebar />
      <div className="bg-gray-50 min-h-screen ml-72">
        <div className="p-10">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Chat Bot</h1>
          <p className="text-gray-500">Ask questions about your notes or content here.</p>
        </div>
      </div>
    </>
  );
} 