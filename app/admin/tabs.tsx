'use client';
import useSWR from 'swr';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useEffect, useMemo, useState } from 'react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function UsersTab() {
	const { data, mutate } = useSWR('/api/admin/users', fetcher);
	const [form, setForm] = useState({ name: '', employeeId: '', email: '', department: '' });
	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
		setForm({ name: '', employeeId: '', email: '', department: '' });
		mutate();
	};
	const remove = async (employeeId: string) => {
		await fetch(`/api/admin/users?employeeId=${encodeURIComponent(employeeId)}`, { method: 'DELETE' });
		mutate();
	};
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader><CardTitle>Add/Update User</CardTitle></CardHeader>
				<CardContent>
					<form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
						<Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
						<Input placeholder="EmpID" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required />
						<Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
						<Input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required />
						<div className="md:col-span-4"><Button type="submit">Save</Button></div>
					</form>
				</CardContent>
			</Card>
			<Card>
				<CardHeader><CardTitle>Users</CardTitle></CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead><TableHead>EmpID</TableHead><TableHead>Email</TableHead><TableHead>Department</TableHead><TableHead></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.users?.map((u: any) => (
								<TableRow key={u.employeeId}>
									<TableCell>{u.name}</TableCell>
									<TableCell>{u.employeeId}</TableCell>
									<TableCell>{u.email}</TableCell>
									<TableCell>{u.department}</TableCell>
									<TableCell className="text-right"><Button variant="destructive" onClick={() => remove(u.employeeId)}>Delete</Button></TableCell>
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
	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<select className="border rounded p-2" value={selectedDraft} onChange={e => setSelectedDraft(e.target.value)}>
					<option value="">Select Draft</option>
					{drafts?.drafts?.map((d: any) => <option key={d._id} value={d._id}>{d.name} ({new Date(d.yearStart).getFullYear()}-{new Date(d.yearEnd).getFullYear()})</option>)}
				</select>
			</div>
			{data && Object.keys(data.grouped || {}).map(batch => (
				<Card key={batch}>
					<CardHeader><CardTitle>Batch {batch}</CardTitle></CardHeader>
					<CardContent>
						{data.grouped[batch].map((r: any) => (
							<div key={r._id} className="border rounded p-3 mb-3">
								<div className="font-medium">{r.userName} ({r.userId}) - {r.department}</div>
								<Table>
									<TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Credits</TableHead><TableHead>Strength</TableHead><TableHead>FN</TableHead><TableHead>AN</TableHead><TableHead>Total</TableHead><TableHead>School</TableHead></TableRow></TableHeader>
									<TableBody>
										{r.entries.map((e: any, idx: number) => (
											<TableRow key={idx}><TableCell>{e.courseCode}</TableCell><TableCell>{e.courseName}</TableCell><TableCell>{e.credits}</TableCell><TableCell>{e.studentStrength}</TableCell><TableCell>{e.fnSlots}</TableCell><TableCell>{e.anSlots}</TableCell><TableCell>{e.totalSlots}</TableCell><TableCell>{e.facultySchool}</TableCell></TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						))}
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default function AdminTabs() {
	return (
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
	);
}


