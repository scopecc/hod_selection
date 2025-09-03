import { redirect } from 'next/navigation';
import { isAdminFromCookies } from '@/lib/admin';
import AdminTabs from './tabs';

export default function AdminHome() {
	const isAdmin = isAdminFromCookies();
	if (!isAdmin) redirect('/admin/login');
	return <AdminTabs />;
}


