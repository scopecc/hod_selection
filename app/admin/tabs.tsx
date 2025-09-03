'use client';
import useSWR from 'swr';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function UsersTab() {
	const { data, mutate } = useSWR('/api/admin/users', fetcher);
	const [form, setForm] = useState({ name: '', employeeId: '', email: '', department: '' });
	const [editingUser, setEditingUser] = useState<any>(null);
	const [isEditing, setIsEditing] = useState(false);

	// Department options
	const departmentOptions = ['scope', 'smec', 'sense', 'select', 'vit-bs'];

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isEditing) {
			await fetch('/api/admin/users', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
		} else {
			await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
		}
		setForm({ name: '', employeeId: '', email: '', department: '' });
		setEditingUser(null);
		setIsEditing(false);
		mutate();
	};

	const editUser = (user: any) => {
		setForm({ name: user.name, employeeId: user.employeeId, email: user.email, department: user.department });
		setEditingUser(user);
		setIsEditing(true);
	};

	const cancelEdit = () => {
		setForm({ name: '', employeeId: '', email: '', department: '' });
		setEditingUser(null);
		setIsEditing(false);
	};

	const remove = async (employeeId: string) => {
		await fetch(`/api/admin/users?employeeId=${encodeURIComponent(employeeId)}`, { method: 'DELETE' });
		mutate();
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader><CardTitle>{isEditing ? 'Update User' : 'Add User'}</CardTitle></CardHeader>
				<CardContent>
					<form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
						<Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
						<Input placeholder="EmpID" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required disabled={isEditing} />
						<Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
						<select className="border rounded p-2" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
							<option value="">Select Department</option>
							{departmentOptions.map(option => <option key={option} value={option}>{option.toUpperCase()}</option>)}
						</select>
						<div className="md:col-span-4 flex gap-2">
							<Button type="submit">{isEditing ? 'Update' : 'Save'}</Button>
							{isEditing && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
						</div>
					</form>
				</CardContent>
			</Card>
			<Card>
				<CardHeader><CardTitle>Users</CardTitle></CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead><TableHead>EmpID</TableHead><TableHead>Email</TableHead><TableHead>Department</TableHead><TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.users?.map((u: any) => (
								<TableRow key={u.employeeId}>
									<TableCell>{u.name}</TableCell>
									<TableCell>{u.employeeId}</TableCell>
									<TableCell>{u.email}</TableCell>
									<TableCell>{u.department}</TableCell>
									<TableCell className="space-x-2">
										<Button variant="outline" size="sm" onClick={() => editUser(u)}>Edit</Button>
										<Button variant="destructive" size="sm" onClick={() => remove(u.employeeId)}>Delete</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

function DraftsTab() {
	const { data, mutate } = useSWR('/api/admin/drafts', fetcher);
	const [form, setForm] = useState({ name: '', yearStart: '', yearEnd: '' });
	const create = async (e: React.FormEvent) => {
		e.preventDefault();
		await fetch('/api/admin/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.name, yearStart: Number(form.yearStart), yearEnd: Number(form.yearEnd) }) });
		setForm({ name: '', yearStart: '', yearEnd: '' });
		mutate();
	};
	const setStatus = async (id: string, status: 'open' | 'closed') => {
		await fetch('/api/admin/drafts', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
		mutate();
	};
	const remove = async (id: string) => {
		await fetch(`/api/admin/drafts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
		mutate();
	};
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader><CardTitle>Create Draft</CardTitle></CardHeader>
				<CardContent>
					<form onSubmit={create} className="grid grid-cols-1 md:grid-cols-4 gap-3">
						<Input placeholder="Draft Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
						<Input type="number" placeholder="Year Start" value={form.yearStart} onChange={e => setForm({ ...form, yearStart: e.target.value })} min="2020" max="2030" required />
						<Input type="number" placeholder="Year End" value={form.yearEnd} onChange={e => setForm({ ...form, yearEnd: e.target.value })} min="2020" max="2030" required />
						<div className="md:col-span-4"><Button type="submit">Create</Button></div>
					</form>
				</CardContent>
			</Card>
			<Card>
				<CardHeader><CardTitle>Drafts</CardTitle></CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead><TableHead>Years</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.drafts?.map((d: any) => (
								<TableRow key={d._id}>
									<TableCell>{d.name}</TableCell>
									<TableCell>{new Date(d.yearStart).getFullYear()}-{new Date(d.yearEnd).getFullYear()}</TableCell>
									<TableCell>{d.status}</TableCell>
									<TableCell className="space-x-2">
										<Button onClick={() => setStatus(d._id, d.status === 'open' ? 'closed' : 'open')}>{d.status === 'open' ? 'Close' : 'Reopen'}</Button>
										<Button variant="destructive" onClick={() => remove(d._id)}>Delete</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}

function UploadTab() {
	const { data: drafts } = useSWR('/api/admin/drafts', fetcher);
	const [selectedDraft, setSelectedDraft] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const upload = async () => {
		if (!selectedDraft || !file) return;
		const formData = new FormData();
		formData.append('file', file);
		await fetch(`/api/admin/courses?draftId=${encodeURIComponent(selectedDraft)}`, { method: 'POST', body: formData });
		alert('Uploaded');
	};
	const clear = async () => {
		if (!selectedDraft) return;
		await fetch(`/api/admin/courses?draftId=${encodeURIComponent(selectedDraft)}`, { method: 'DELETE' });
		alert('Cleared');
	};
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader><CardTitle>Upload Courses (CSV)</CardTitle></CardHeader>
				<CardContent className="space-y-3">
					<select className="border rounded p-2 w-full" value={selectedDraft} onChange={e => setSelectedDraft(e.target.value)}>
						<option value="">Select Draft</option>
						{drafts?.drafts?.map((d: any) => <option key={d._id} value={d._id}>{d.name} ({new Date(d.yearStart).getFullYear()}-{new Date(d.yearEnd).getFullYear()})</option>)}
					</select>
					<input type="file" accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => setFile(e.target.files?.[0] || null)} />
					<div className="flex gap-2">
						<Button onClick={upload}>Upload</Button>
						<Button variant="destructive" onClick={clear}>Delete Dataset</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function RegistrationsTab() {
	const { data: drafts } = useSWR('/api/admin/drafts', fetcher);
	const [selectedDraft, setSelectedDraft] = useState('');
	const { data, mutate } = useSWR(() => selectedDraft ? `/api/admin/registrations?draftId=${encodeURIComponent(selectedDraft)}` : null, fetcher, { refreshInterval: 5000 });
	useEffect(() => { mutate(); }, [selectedDraft]);

	// Function to download registrations as Excel
	const downloadRegistrations = async () => {
		if (!selectedDraft || !data) return;

		try {
			const response = await fetch('/api/admin/registrations/download', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draftId: selectedDraft })
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `registrations_${selectedDraft}.xlsx`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				alert('Failed to download registrations');
			}
		} catch (error) {
			alert('Error downloading registrations');
		}
	};

	// Group registrations by user instead of batch
	const userWiseRegistrations = useMemo(() => {
		if (!data?.registrations) return [];
		
		const userMap = new Map();
		
		data.registrations.forEach((reg: any) => {
			if (!userMap.has(reg.userId)) {
				userMap.set(reg.userId, {
					userId: reg.userId,
					userName: reg.userName,
					department: reg.department,
					entries: []
				});
			}
			
			// Add batch information to each entry
			reg.entries.forEach((entry: any) => {
				userMap.get(reg.userId).entries.push({
					...entry,
					batch: reg.batch
				});
			});
		});

		// Sort entries by batch in ascending order for each user
		userMap.forEach((user) => {
			user.entries.sort((a: any, b: any) => Number(a.batch) - Number(b.batch));
		});

		return Array.from(userMap.values());
	}, [data]);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Registration Overview</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2 items-center">
						<select className="border rounded p-2" value={selectedDraft} onChange={e => setSelectedDraft(e.target.value)}>
							<option value="">Select Draft</option>
							{drafts?.drafts?.map((d: any) => <option key={d._id} value={d._id}>{d.name} ({new Date(d.yearStart).getFullYear()}-{new Date(d.yearEnd).getFullYear()})</option>)}
						</select>
						{selectedDraft && userWiseRegistrations.length > 0 && (
							<Button onClick={downloadRegistrations} className="flex items-center gap-2">
								<Download className="h-4 w-4" />
								Download Excel
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
			
			{userWiseRegistrations.map((user) => (
				<Card key={user.userId}>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>{user.userName} ({user.userId}) - {user.department}</span>
							<span className="text-sm text-muted-foreground">Total Courses: {user.entries.length}</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Batch</TableHead>
									<TableHead>Code</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Credits</TableHead>
									<TableHead>Strength</TableHead>
									<TableHead>FN</TableHead>
									<TableHead>AN</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Faculty School</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{user.entries.map((e: any, idx: number) => (
									<TableRow key={idx}>
										<TableCell className="font-medium">{e.batch}</TableCell>
										<TableCell className="font-mono text-sm">{e.courseCode}</TableCell>
										<TableCell>{e.courseName}</TableCell>
										<TableCell>{e.credits}</TableCell>
										<TableCell>{e.studentStrength}</TableCell>
										<TableCell>{e.fnSlots}</TableCell>
										<TableCell>{e.anSlots}</TableCell>
										<TableCell className="font-semibold">{e.totalSlots}</TableCell>
										<TableCell>{e.facultySchool}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default function AdminTabs() {
	const router = useRouter();

	const handleLogout = async () => {
		await fetch('/api/admin/login', { method: 'DELETE' });
		router.push('/admin/login');
	};

	return (
		<div>
			<div className="flex justify-between items-center p-4 border-b">
				<h1 className="text-2xl font-bold">Admin Dashboard</h1>
				<Button variant="outline" onClick={handleLogout}>Logout</Button>
			</div>
			<Tabs defaultValue="users" className="p-4">
				<TabsList>
					<TabsTrigger value="users">Users</TabsTrigger>
					<TabsTrigger value="drafts">Drafts</TabsTrigger>
					<TabsTrigger value="upload">Upload</TabsTrigger>
					<TabsTrigger value="registrations">Registrations</TabsTrigger>
				</TabsList>
				<TabsContent value="users"><UsersTab /></TabsContent>
				<TabsContent value="drafts"><DraftsTab /></TabsContent>
				<TabsContent value="upload"><UploadTab /></TabsContent>
				<TabsContent value="registrations"><RegistrationsTab /></TabsContent>
			</Tabs>
		</div>
	);
}


