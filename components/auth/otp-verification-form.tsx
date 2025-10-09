'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export function OTPVerificationForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const employeeId = searchParams.get('employeeId');
  const maskedEmail = searchParams.get('email');

  // Redirect if employeeId is missing
  useEffect(() => {
    if (!employeeId) {
      const timer = setTimeout(() => {
        router.push('/auth/signin');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [employeeId, router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('otp-verification', {
        employeeId,
        otp: otpCode,
        redirect: true,
      });

      if (result?.error) throw new Error(result.error);

      router.push('/registration');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });

      if (!response.ok) throw new Error('Failed to resend OTP');

      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 320,
        margin: '80px auto',
        padding: 24,
        border: '1px solid #eee',
        borderRadius: 8,
        background: '#fff',
      }}
    >
      {!employeeId ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Redirecting…</p>
      ) : (
        <>
          {error && (
            <div style={{ color: 'red', marginBottom: 12, fontSize: 14 }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Enter OTP
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(index, e.target.value.replace(/\D/g, ''))
                  }
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    width: 36,
                    height: 36,
                    textAlign: 'center',
                    fontSize: 18,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 10,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 16,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: 8,
            }}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isLoading || timeLeft > 0}
            style={{
              width: '100%',
              padding: 10,
              background: '#f3f4f6',
              color: '#222',
              border: 'none',
              borderRadius: 4,
              fontWeight: 500,
              fontSize: 15,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: 8,
            }}
          >
            Resend OTP
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
            {timeLeft > 0
              ? `Time remaining: ${formatTime(timeLeft)}`
              : 'OTP has expired'}
          </div>
        </>
      )}
    </form>
  );
}
