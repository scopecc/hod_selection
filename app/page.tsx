import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:75px_75px]" />
      
      {/* Main Content - Now perfectly centered */}
      <div className="max-w-md w-full px-4 sm:px-6 lg:px-8">
        {/* Hero Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 border border-white/20">
          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Course Registration</h2>
            <p className="text-gray-600">Access your registration portal</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Admin Login */}
            <Link 
              href="/admin/login"
              className="group relative w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold transition-all duration-200 hover:from-gray-800 hover:to-gray-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <svg className="w-5 h-5 mr-3 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Portal
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            {/* User Login */}
            <Link 
              href="/auth/login"
              className="group relative w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold transition-all duration-200 hover:from-blue-500 hover:to-blue-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              HOD Portal
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          
        </div>
      </div>
    </div>
  );
}
