'use client';

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';

type Step = 'employee-id' | 'otp-sent' | 'otp-input' | 'success';


export default function LoginPage() {
  const [step, setStep] = useState<Step>('employee-id');
  const [employeeId, setEmployeeId] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const { data: session, status } = useSession();

  // If already logged in, redirect to /registration
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/registration');
    }
  }, [status, router]);

  const handleEmployeeIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Please enter your Employee ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId: employeeId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMaskedEmail(data.maskedEmail);
        setStep('otp-sent');
        setResendCooldown(60); // 60 seconds cooldown
        setTimeout(() => setStep('otp-input'), 1500);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeId: employeeId.trim(), 
          otp: otp.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Now establish NextAuth session using credentials provider
        const result = await signIn('otp-verification', {
          redirect: true,
          employeeId: employeeId.trim(),
          otp: otp.trim(),
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a page reload to ensure session is established
        window.location.href = '/registration';
        return;
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep('employee-id');
    setEmployeeId('');
    setOtp('');
    setMaskedEmail('');
    setError('');
    setResendCooldown(0);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId: employeeId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendCooldown(60);
        setError('');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const renderStepIndicator = () => {
    const steps = [
      { id: 'employee-id', label: 'Employee ID', icon: Shield },
      { id: 'otp-input', label: 'Verification', icon: Mail },
      { id: 'success', label: 'Complete', icon: CheckCircle },
    ];

    const currentStepIndex = steps.findIndex(s => 
      step === s.id || (step === 'otp-sent' && s.id === 'otp-input')
    );

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepItem, index) => {
          const Icon = stepItem.icon;
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={stepItem.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full transition-colors
                ${isActive ? 'bg-primary text-primary-foreground' : 
                  isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {stepItem.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`mx-4 h-px w-12 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {renderStepIndicator()}
        
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Employee Login</CardTitle>
            <CardDescription>
              {step === 'employee-id' && 'Enter your Employee ID to continue'}
              {step === 'otp-sent' && 'Sending OTP to your registered email...'}
              {step === 'otp-input' && `Enter the OTP sent to ${maskedEmail}`}
              {step === 'success' && 'Login completed successfully!'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'employee-id' && (
              <form onSubmit={handleEmployeeIdSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="Enter your Employee ID"
                    value={employeeId}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      setEmployeeId(value);
                      setError('');
                    }}
                    disabled={loading}
                    className="text-center text-lg"
                    maxLength={10}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !employeeId.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </form>
            )}

            {step === 'otp-sent' && (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    OTP is being sent to {maskedEmail}
                  </p>
                </div>
              </div>
            )}

            {step === 'otp-input' && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                      setError('');
                    }}
                    disabled={loading}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Check your email for the 6-digit OTP
                  </p>
                </div>
                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendOTP}
                    disabled={loading || resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleStartOver}
                    disabled={loading}
                  >
                    Use Different Employee ID
                  </Button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <div>
                  <h3 className="text-xl font-semibold text-green-600">Login Successful!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Welcome back, Employee {employeeId}
                  </p>
                </div>
                <Button onClick={handleStartOver} variant="outline" className="mt-4">
                  Login Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          OTP expires in {process.env.NEXT_PUBLIC_OTP_EXPIRY_MINUTES || 1} minutes
        </p>
      </div>
    </div>
  );
}