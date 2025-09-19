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
import { Listbox } from '@headlessui/react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function UsersTab() {
	const { data, mutate } = useSWR('/api/admin/users', fetcher);
	const departmentOptions = [
		'SAS', 'SBST', 'SCE', 'SCHEME', 'SCOPE', 'SCORE', 'SELECT', 'SENSE', 'SHINE', 'SMEC', 'SSL', 'HOT', 'VAIAL', 'VIT BS', 'V-SIGN', 'V-SMART', 'V-SPARC'
	];
	const programmeOptions = [
		{ degree: 'BTech', programme: 'CSE', representation: 'BCE' },
		{ degree: 'BTech', programme: 'AIML', representation: 'BAI' },
		{ degree: 'BTech', programme: 'AIR', representation: 'BRS' },
		{ degree: 'BTech', programme: 'Cyber Security', representation: 'BYB' },
		{ degree: 'BTech', programme: 'Data Science', representation: 'BDS' },
		{ degree: 'BTech', programme: 'CPS', representation: 'BPS' },
		{ degree: 'MTech (Int)', programme: 'Business Analytics (2021–2024) / Data Science (2025)', representation: 'MIA / MID' },
		{ degree: 'MTech (Int)', programme: 'SE', representation: 'MIS' },
		{ degree: 'MTech', programme: 'CSE', representation: 'MCS' },
		{ degree: 'MTech', programme: 'AIML', representation: 'MAI' },
		{ degree: 'MTech LTI', programme: 'AIML', representation: 'MML' },
		{ degree: 'MTech LTI', programme: 'AIDS', representation: 'MAS' },
		{ degree: 'MCA', programme: '—', representation: 'MCA' },
		{ degree: 'BSC', programme: '—', representation: 'BCS' }
	];
	const [form, setForm] = useState({ name: '', employeeId: '', email: '', department: '', programme: '' });
	const [editingUser, setEditingUser] = useState<any>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [programmeSearch, setProgrammeSearch] = useState('');
	const filteredProgrammeOptions = programmeOptions.filter(opt =>
		(`${opt.degree} ${opt.programme} ${opt.representation}`.toLowerCase().includes(programmeSearch.toLowerCase()))
	);
	const [departmentSearch, setDepartmentSearch] = useState('');
	const filteredDepartmentOptions = departmentOptions.filter(opt =>
		opt.toLowerCase().includes(departmentSearch.toLowerCase())
	);


	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		// Title case helper
		const toTitleCase = (str: string): string => str ? str.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';
		// Ensure programme is included in payload
		const payload = {
			...form,
			name: toTitleCase(form.name),
			employeeId: toTitleCase(form.employeeId),
			email: form.email,
			department: form.department.trim().toUpperCase(),
			programme: form.programme
		};
		if (!payload.programme) {
			payload.programme = '';
		}
		if (isEditing) {
			await fetch('/api/admin/users', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
		} else {
			await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
		}
		setForm({ name: '', employeeId: '', email: '', department: '', programme: '' });
		setEditingUser(null);
		setIsEditing(false);
		mutate();
	};

	const editUser = (user: any) => {
		setForm({
			name: user.name,
			employeeId: user.employeeId,
			email: user.email,
			department: user.department,
			programme: user.programme || ''
		});
		setEditingUser(user);
		setIsEditing(true);
	};

	const cancelEdit = () => {
		setForm({ name: '', employeeId: '', email: '', department: '', programme: '' });
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
					<form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
							<Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
							<Input placeholder="EmpID" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required disabled={isEditing} />
							<Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
							{/* Department Listbox */}
							<div className="relative w-full">
								<Listbox value={form.department} onChange={val => setForm({ ...form, department: val })}>
									<div className="relative">
										<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
											<span className="truncate text-left">{form.department || 'Select Department'}</span>
											<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
										</Listbox.Button>
										<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
											<div className="sticky top-0 bg-white dark:bg-zinc-900 px-2 py-2">
												<input
													type="text"
													className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
													placeholder="Search department..."
													value={departmentSearch}
													onChange={e => setDepartmentSearch(e.target.value)}
													autoFocus
												/>
											</div>
											{filteredDepartmentOptions.length ? (
												filteredDepartmentOptions.map((opt, idx) => (
													<Listbox.Option
														key={idx}
														value={opt}
														className={({ active, selected }: { active: boolean; selected: boolean }) =>
															`cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`
														}
													>
														{opt}
													</Listbox.Option>
												))
											) : (
												<div className="px-3 py-2 text-zinc-400">No departments found</div>
											)}
										</Listbox.Options>
									</div>
								</Listbox>
							</div>
							{/* Programme Listbox */}
							<div className="relative w-full">
								<Listbox value={form.programme} onChange={val => setForm({ ...form, programme: val })}>
									<div className="relative">
										<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
											<span className="truncate text-left">{form.programme || 'Select Programme'}</span>
											<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
										</Listbox.Button>
										<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
											<div className="sticky top-0 bg-white dark:bg-zinc-900 px-2 py-2">
												<input
													type="text"
													className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
													placeholder="Search programme..."
													value={programmeSearch}
													onChange={e => setProgrammeSearch(e.target.value)}
													autoFocus
												/>
											</div>
											{filteredProgrammeOptions.length ? (
												filteredProgrammeOptions.map((opt, idx) => (
													<Listbox.Option
														key={idx}
														value={`${opt.degree} ${opt.programme} (${opt.representation})`}
														className={({ active, selected }: { active: boolean; selected: boolean }) =>
															`cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`
														}
													>
														{opt.degree} {opt.programme} <span className="text-xs text-zinc-400">({opt.representation})</span>
													</Listbox.Option>
												))
											) : (
												<div className="px-3 py-2 text-zinc-400">No programmes found</div>
											)}
										</Listbox.Options>
									</div>
								</Listbox>
							</div>
							<div className="md:col-span-5 flex gap-2">
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
								<TableHead>Name</TableHead>
								<TableHead>EmpID</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Department</TableHead>
								<TableHead>Programme</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.users?.map((u: any) => (
								<TableRow key={u.employeeId}>
									<TableCell>{u.name}</TableCell>
									<TableCell>{u.employeeId}</TableCell>
									<TableCell>{u.email}</TableCell>
									<TableCell>{u.department}</TableCell>
									<TableCell>{u.programme ? u.programme : '-'}</TableCell>
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
		const res = await fetch('/api/admin/drafts', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: form.name, yearStart: Number(form.yearStart), yearEnd: Number(form.yearEnd) })
		});
		if (res.status === 409) {
			alert('A draft with this name already exists. Please choose a different name.');
			return;
		}
		if (!res.ok) {
			alert('Failed to create draft.');
			return;
		}
		setForm({ name: '', yearStart: '', yearEnd: '' });
		mutate();
	};
	const setStatus = async (id: string, status: 'open' | 'closed') => {
		await fetch('/api/admin/drafts', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
		mutate();
	};
	const remove = async (id: string) => {
		if (window.confirm('Are you sure you want to delete this draft?')) {
			await fetch(`/api/admin/drafts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
			mutate();
		}
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

	// Function to download all registrations as Excel
	const downloadRegistrations = async () => {
		if (!selectedDraft || !data || !drafts?.drafts) return;
		const draft = drafts.drafts.find((d: any) => d._id === selectedDraft);
		const draftName = draft ? draft.name : selectedDraft;
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
				a.download = `registrations_${draftName}.xlsx`;
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

	// Function to download a single user's registrations as Excel
	const downloadUserRegistration = async (userId: string, userName: string, userDept: string) => {
		if (!selectedDraft || !userId || !userName || !drafts?.drafts || !userDept) return;
		const draft = drafts.drafts.find((d: any) => d._id === selectedDraft);
		const draftName = draft ? draft.name : selectedDraft;
		try {
			const response = await fetch('/api/admin/registrations/download', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draftId: selectedDraft, userId })
			});
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${userName}_${userDept}_${draftName}.xlsx`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				alert('Failed to download user registration');
			}
		} catch (error) {
			alert('Error downloading user registration');
		}
	};

	// Delete user registration with confirmation
	const deleteUserRegistration = async (userId: string) => {
		if (!selectedDraft || !userId) return;
		if (!window.confirm('Are you sure you want to delete all registrations for this user?')) return;
		try {
			await fetch(`/api/admin/registrations?draftId=${encodeURIComponent(selectedDraft)}&userId=${encodeURIComponent(userId)}`, {
				method: 'DELETE',
			});
			mutate();
		} catch {
			alert('Failed to delete user registration');
		}
	};
	// Delete individual entry for a user
	const deleteUserEntry = async (userId: string, entryIdx: number) => {
		if (!selectedDraft || !userId) return;
		if (!window.confirm('Are you sure you want to delete this course entry for this user?')) return;
		try {
			await fetch(`/api/admin/registrations?draftId=${encodeURIComponent(selectedDraft)}&userId=${encodeURIComponent(userId)}&entryIdx=${entryIdx}`, {
				method: 'DELETE',
			});
			mutate();
		} catch {
			alert('Failed to delete course entry');
		}
	};
	// Group registrations by user
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
			reg.entries.forEach((entry: any) => {
				userMap.get(reg.userId).entries.push({ ...entry });
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
								<span className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">Total Courses: {user.entries.length}</span>
									<Button variant="ghost" size="sm" onClick={() => downloadUserRegistration(user.userId, user.userName, user.department)} title="Download Excel">
										<Download className="h-4 w-4" />
									</Button>
									<Button variant="destructive" size="sm" onClick={() => deleteUserRegistration(user.userId)} title="Delete User Registration">
										Delete
									</Button>
								</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Batch</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>L</TableHead>
										<TableHead>T</TableHead>
										<TableHead>P</TableHead>
										<TableHead>J</TableHead>
										<TableHead>Credits</TableHead>
										<TableHead>Strength</TableHead>
										<TableHead>Group</TableHead>
										<TableHead>FN</TableHead>
										<TableHead>AN</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Faculty School</TableHead>
										<TableHead>Prerequisites</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{user.entries.map((e: any, idx: number) => (
										<TableRow key={idx}>
											<TableCell className="font-medium">{e.batch}</TableCell>
											<TableCell className="font-mono text-sm">{e.courseCode}</TableCell>
											<TableCell>{e.courseName}</TableCell>
											<TableCell>{e.L ?? '-'}</TableCell>
											<TableCell>{e.T ?? '-'}</TableCell>
											<TableCell>{e.P ?? '-'}</TableCell>
											<TableCell>{e.J ?? '-'}</TableCell>
											<TableCell>{e.credits}</TableCell>
											<TableCell>{e.studentStrength}</TableCell>
											<TableCell>{e.group}</TableCell>
											<TableCell>{e.fnSlots}</TableCell>
											<TableCell>{e.anSlots}</TableCell>
											<TableCell className="font-semibold">{e.totalSlots}</TableCell>
											<TableCell>{e.facultySchool}</TableCell>
											<TableCell>{Array.isArray(e.prerequisites) && e.prerequisites.length > 0 ? e.prerequisites.join(', ') : '-'}</TableCell>
											<TableCell>
												<Button variant="destructive" size="sm" onClick={() => deleteUserEntry(user.userId, idx)} title="Delete Course Entry">Delete</Button>
											</TableCell>
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
		router.push('/');
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


