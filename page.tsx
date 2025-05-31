import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Electrical AI Assistant
        </h1>
        <p className="text-gray-600 mb-8">
          Your intelligent assistant for electrical distribution and product management
        </p>
        <Link 
          href="/chat"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 inline-block"
        >
          Start Chat
        </Link>
        <div className="mt-8 text-sm text-gray-500">
          <p>Ask about:</p>
          <div className="mt-2 space-y-1">
            <div>• Product availability</div>
            <div>• Technical specifications</div>
            <div>• Inventory management</div>
          </div>
        </div>
      </div>
    </div>
  )
}
