'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminTabs from './tabs';

export default function AdminHome() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		// Check authentication on client side
		const checkAuth = async () => {
			try {
				const response = await fetch('/api/admin/check-auth');
				if (response.ok) {
					setIsAuthenticated(true);
				} else {
					router.push('/admin/login');
				}
			} catch (error) {
				router.push('/admin/login');
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null; // Will redirect to login
	}

	return <AdminTabs />;
}


