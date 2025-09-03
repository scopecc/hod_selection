import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="max-w-lg w-full p-8 text-center bg-white/70 backdrop-blur rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-6">Course Registration Portal</h1>
        <div className="grid grid-cols-1 gap-4">
          <Link href="/admin/login" className="px-6 py-3 rounded bg-gray-900 text-white hover:bg-gray-800">Admin Login</Link>
          <Link href="/auth/login" className="px-6 py-3 rounded bg-emerald-600 text-white hover:bg-emerald-700">User Login</Link>
        </div>
      </div>
    </div>
  );
}
