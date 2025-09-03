import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OTPVerificationForm } from '@/components/auth/otp-verification-form';
import { Suspense } from 'react';

function OTPPageContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="w-full max-w-md p-6">
        <OTPVerificationForm />
      </div>
    </div>
  );
}

export default async function VerifyOTPPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/registration');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPPageContent />
    </Suspense>
  );
}