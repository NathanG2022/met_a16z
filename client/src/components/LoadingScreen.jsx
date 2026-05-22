export default function LoadingScreen({ message = 'Processing…' }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 mb-4">{message}</div>
        <div className="flex justify-center">
          <span className="inline-block w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
