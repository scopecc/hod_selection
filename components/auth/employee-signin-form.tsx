'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IdCard, Loader2 } from 'lucide-react';

export function EmployeeSignInForm() {
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Redirect to OTP verification page with employee ID
      router.push(`/auth/verify-otp?employeeId=${encodeURIComponent(employeeId)}&email=${encodeURIComponent(data.maskedEmail)}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '80px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
      {error && (
        <div style={{ color: 'red', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="employeeId" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Employee ID</label>
        <input
          id="employeeId"
          type="text"
          placeholder="1000"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, ''))}
          required
          disabled={isLoading}
          style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, fontSize: 16 }}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        style={{ width: '100%', padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 16, cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        {isLoading ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </form>
  );
}