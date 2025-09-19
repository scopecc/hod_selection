'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const router = useRouter();

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
		setLoading(false);
		if (!res.ok) {
			const j = await res.json();
			setError(j.error || 'Login failed');
			return;
		}
		router.push('/admin');
	};

	const handleLogout = async () => {
		await fetch('/', { method: 'DELETE' });
		setError('');
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Admin Login</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={submit} className="space-y-3">
						<Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
						<Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
						{error && <div className="text-sm text-red-600">{error}</div>}
						<div className="flex gap-2">
							<Button disabled={loading} className="flex-1" type="submit">{loading ? 'Signing in...' : 'Sign in'}</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}


