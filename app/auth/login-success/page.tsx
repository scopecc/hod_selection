export default function LoginSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="bg-white p-10 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Login Successful!</h1>
        <p className="text-lg text-gray-700 mb-6">You have successfully logged in. Welcome to the Employee Portal.</p>
        <a href="/registration" className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition">Go to Dashboard</a>
      </div>
    </div>
  );
}
