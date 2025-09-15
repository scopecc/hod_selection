'use client';
import useSWR from 'swr';
import { signOut } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Listbox } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Save, Send, Plus, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RegistrationPage() {
	// Block back navigation to login pages after login
	useEffect(() => {
		const forbidden = ['/auth/login', '/auth/signin', '/auth', '/login'];
		const handlePopState = () => {
			if (forbidden.includes(window.location.pathname)) {
				window.location.replace('/registration');
			}
		};
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);
	// Prevent back navigation to login if already logged in
	useEffect(() => {
		if (window.location.pathname === '/registration') {
			window.history.replaceState(null, '', '/registration');
		}
	}, []);
	const router = useRouter();
	const { data: draftsData } = useSWR('/api/drafts', fetcher);
	const [user, setUser] = useState<{ name?: string; id?: string } | null>(null);
	useEffect(() => {
		fetch('/api/auth/session').then(res => res.json()).then(data => {
			setUser(data?.user || null);
		});
	}, []);
	// Logout handler
	const handleLogout = async () => {
		await signOut({ redirect: false });
		router.push('/');
	};
	const [selectedDraft, setSelectedDraft] = useState('');
	const [batch, setBatch] = useState('');
	const { data: coursesData } = useSWR(() => selectedDraft ? `/api/courses?draftId=${encodeURIComponent(selectedDraft)}` : null, fetcher);
	const [entries, setEntries] = useState<any[]>([]);
	const [courseCode, setCourseCode] = useState('');
	const [courseName, setCourseName] = useState('');
	const [credits, setCredits] = useState<number | ''>('');
	const [group, setGroup] = useState('');
	const [studentStrength, setStudentStrength] = useState<number | ''>('');
	const [fnSlots, setFnSlots] = useState<number | ''>('');
	const [anSlots, setAnSlots] = useState<number | ''>('');
	const [facultySchool, setFacultySchool] = useState('');
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');

	// Load existing registration if available
	const { data: userDraft, mutate: mutateDraft } = useSWR(
		selectedDraft ? `/api/user_drafts?draftId=${encodeURIComponent(selectedDraft)}` : null,
		fetcher
	);
	const { data: existingRegistration, mutate: mutateRegistration } = useSWR(
		selectedDraft ? `/api/registrations?draftId=${encodeURIComponent(selectedDraft)}` : null,
		fetcher
	);

	useEffect(() => {
		if (userDraft?.draft) {
			setEntries(userDraft.draft.entries || []);
			setBatch('');
		} else {
			setEntries([]);
			setBatch('');
		}
	}, [userDraft]);

	useEffect(() => {
		if (!courseCode) { setCourseName(''); setCredits(''); setGroup(''); return; }
		const c = coursesData?.courses?.find((c: any) => c.courseCode === courseCode);
		if (c) {
			setCourseName(c.courseName);
			setCredits(c.credits);
			setGroup(c.group || '');
		}
	}, [courseCode, coursesData]);

	const resetForm = () => {
		setCourseCode('');
		setCourseName('');
		setCredits('');
		setGroup('');
		setStudentStrength('');
		setFnSlots('');
		setAnSlots('');
		setFacultySchool('');
		setEditingIndex(null);
	};

	const addEntry = () => {
		if (!batch || !courseCode || !courseName || !credits || !studentStrength || !fnSlots || !anSlots || !facultySchool) return;
		const totalSlots = Number(fnSlots) + Number(anSlots);
		const newEntry = { 
			courseCode, 
			courseName, 
			credits: Number(credits), 
			group,
			studentStrength: Number(studentStrength), 
			fnSlots: Number(fnSlots), 
			anSlots: Number(anSlots), 
			totalSlots, 
			facultySchool,
			batch
		};
		if (editingIndex !== null) {
			// Update existing entry
			const newEntries = [...entries];
			newEntries[editingIndex] = newEntry;
			setEntries(newEntries);
		} else {
			// Add new entry
			setEntries([...entries, newEntry]);
		}
		resetForm();
	};

	const editEntry = (index: number) => {
		const entry = entries[index];
		setCourseCode(entry.courseCode);
		setCourseName(entry.courseName);
		setCredits(entry.credits);
		setGroup(entry.group || '');
		setStudentStrength(entry.studentStrength);
		setFnSlots(entry.fnSlots);
		setAnSlots(entry.anSlots);
		setFacultySchool(entry.facultySchool);
		setBatch(entry.batch);
		setEditingIndex(index);
	};

	const deleteEntry = (index: number) => {
		const newEntries = entries.filter((_, i) => i !== index);
		setEntries(newEntries);
		if (editingIndex === index) {
			resetForm();
		}
	};

	const saveDraft = async () => {
		if (!selectedDraft || entries.length === 0) {
			setMessage('Please select a draft and add at least one course');
			return;
		}
		setLoading(true);
		setMessage('');
		try {
			const response = await fetch('/api/user_drafts', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draftId: selectedDraft, entries })
			});
			if (response.ok) {
				setMessage('Draft saved successfully!');
				mutateDraft();
			} else {
				const error = await response.json();
				setMessage(error.error || 'Failed to save draft');
			}
		} catch (error) {
			setMessage('Network error occurred');
		} finally {
			setLoading(false);
		}
	};

	const submit = async () => {
		if (!selectedDraft || entries.length === 0) {
			setMessage('Please select a draft and add at least one course');
			return;
		}
		setLoading(true);
		setMessage('');
		try {
			const response = await fetch('/api/registrations', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draftId: selectedDraft, entries, status: 'submitted' })
			});
			if (response.ok) {
				setMessage('Registration submitted successfully!');
				mutateRegistration();
				setEntries([]);
				setBatch('');
			} else {
				const error = await response.json();
				setMessage(error.error || 'Failed to submit registration');
			}
		} catch (error) {
			setMessage('Network error occurred');
		} finally {
			setLoading(false);
		}
	};

	// Sort entries by batch in ascending order
	const sortedEntries = useMemo(() => {
		return [...entries].sort((a, b) => {
			return Number(a.batch) - Number(b.batch);
		});
	}, [entries]);

	// Generate year options between year1 and year2
	const yearOptions = useMemo(() => {
		const d = draftsData?.drafts?.find((d: any) => d._id === selectedDraft);
		if (!d) return [];
		const startYear = new Date(d.yearStart).getFullYear();
		const endYear = new Date(d.yearEnd).getFullYear();
		const years = [];
		for (let year = startYear; year <= endYear; year++) {
			years.push(year.toString());
		}
		return years;
	}, [selectedDraft, draftsData]);

	// Faculty school options
	const facultySchoolOptions = ['scope', 'smec', 'sense', 'select', 'vit-bs'];

		return (
			<div className="p-4 space-y-4">
				{/* User Info Banner and Logout Button on same line */}
				{user && (
					<div className="mb-4 flex items-center justify-between p-3 rounded bg-blue-50 border border-blue-200">
						<div className="flex items-center gap-4">
							<span className="font-semibold text-blue-900">Welcome! {user.name}</span>
							<span className="text-blue-700">Emp Id: ({user.id})</span>
						</div>
						<Button variant="outline" onClick={handleLogout}>
							Logout
						</Button>
					</div>
				)}
				{/* Message Display */}
				{message && (
					<div className={`p-3 rounded-lg ${message.includes('successfully') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
						{message}
					</div>
				)}

			<Card>
				<CardHeader><CardTitle>Registration</CardTitle></CardHeader>
				<CardContent className="grid grid-cols-1 md:grid-cols-1 gap-3">
					<select className="border rounded p-2" value={selectedDraft} onChange={e => { setSelectedDraft(e.target.value); setBatch(''); setEntries([]); }}>
						<option value="">Select Draft</option>
						{draftsData?.drafts?.map((d: any) => <option key={d._id} value={d._id}>{d.name} ({new Date(d.yearStart).getFullYear()}-{new Date(d.yearEnd).getFullYear()})</option>)}
					</select>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>{editingIndex !== null ? 'Edit Course' : 'Add Course'}</CardTitle></CardHeader>
				<CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<select className="border rounded p-2" value={batch} onChange={e => setBatch(e.target.value)} disabled={!selectedDraft}>
						<option value="">Select Batch</option>
						{yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
					</select>
														{/* Searchable Listbox for Course Name, styled to match input/select */}
														{(() => {
															const [search, setSearch] = useState('');
															const filteredCourses = coursesData?.courses?.filter((c: any) =>
																c.courseName.toLowerCase().includes(search.toLowerCase())
															) || [];
															// Find selected course for display
															const selectedCourse = coursesData?.courses?.find((c: any) => c.courseCode === courseCode);
															return (
																<div className="relative w-full">
																	<Listbox value={courseCode} onChange={setCourseCode} disabled={!coursesData?.courses?.length}>
																		<div className="relative">
																			<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
																				<span className="truncate text-left">
																					{selectedCourse ? `${selectedCourse.courseName} (${selectedCourse.courseCode})` : 'Select Course'}
																				</span>
																				<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
																			</Listbox.Button>
																			<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
																				<div className="sticky top-0 bg-white dark:bg-zinc-900 px-2 py-2">
																					<input
																						type="text"
																						className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
																						placeholder="Search course name..."
																						value={search}
																						onChange={e => setSearch(e.target.value)}
																						autoFocus
																					/>
																				</div>
																				{filteredCourses.length ? (
																					filteredCourses.map((c: any) => (
																						<Listbox.Option
																							key={c.courseCode}
																							value={c.courseCode}
																							className={(
																								{ active, selected }: { active: boolean; selected: boolean }
																							) =>
																								`cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`
																							}
																						>
																							{c.courseName} <span className="text-xs text-zinc-400">({c.courseCode})</span>
																						</Listbox.Option>
																					))
																				) : (
																					<div className="px-3 py-2 text-zinc-400">No courses found</div>
																				)}
																			</Listbox.Options>
																		</div>
																	</Listbox>
																</div>
															);
														})()}
					<Input placeholder="Course Name" value={courseName} readOnly />
					<Input placeholder="Credits" value={credits} readOnly />
					<Input placeholder="Total Student Strength" value={studentStrength} onChange={e => setStudentStrength(Number(e.target.value) || '')} />
					<Input placeholder="Group" value={group} readOnly />
					<Input placeholder="FN Slots" value={fnSlots} onChange={e => setFnSlots(Number(e.target.value) || '')} />
					<Input placeholder="AN Slots" value={anSlots} onChange={e => setAnSlots(Number(e.target.value) || '')} />
					<Input placeholder="Total Slots" value={(Number(fnSlots || 0) + Number(anSlots || 0)) || ''} readOnly />
					<select className="border rounded p-2" value={facultySchool} onChange={e => setFacultySchool(e.target.value)}>
						<option value="">Select Faculty School</option>
						{facultySchoolOptions.map(option => <option key={option} value={option}>{option.toUpperCase()}</option>)}
					</select>
					<div className="md:col-span-4 flex gap-2">
						<Button 
							onClick={addEntry} 
							disabled={!batch || !courseCode || !courseName || !credits || !studentStrength || !fnSlots || !anSlots || !facultySchool}
							className="flex-1"
						>
							{editingIndex !== null ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
							{editingIndex !== null ? 'Update Course' : 'Add Course'}
						</Button>
						{editingIndex !== null && (
							<Button variant="outline" onClick={resetForm}>
								<X className="h-4 w-4 mr-2" />
								Cancel
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{entries.length > 0 && (
				<Card>
					<CardHeader><CardTitle>Entries ({entries.length})</CardTitle></CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Batch</TableHead>
									<TableHead>Code</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Credits</TableHead>
									<TableHead>Strength</TableHead>
									<TableHead>Group</TableHead>
									<TableHead>FN</TableHead>
									<TableHead>AN</TableHead>
									<TableHead>Total</TableHead>
									<TableHead>Faculty School</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedEntries.map((e, idx) => (
									<TableRow key={idx}>
										<TableCell className="font-medium">{e.batch}</TableCell>
										<TableCell className="font-mono text-sm">{e.courseCode}</TableCell>
										<TableCell>{e.courseName}</TableCell>
										<TableCell>{e.credits}</TableCell>
										<TableCell>{e.studentStrength}</TableCell>
										<TableCell>{e.group}</TableCell>
										<TableCell>{e.fnSlots}</TableCell>
										<TableCell>{e.anSlots}</TableCell>
										<TableCell className="font-semibold">{e.totalSlots}</TableCell>
										<TableCell>{e.facultySchool}</TableCell>
										<TableCell className="space-x-2">
											<Button variant="outline" size="sm" onClick={() => editEntry(idx)}>
												<Edit className="h-3 w-3 mr-1" />
												Edit
											</Button>
											<Button variant="destructive" size="sm" onClick={() => deleteEntry(idx)}>
												<Trash2 className="h-3 w-3 mr-1" />
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<div className="flex gap-2 mt-4">
							<Button onClick={saveDraft} disabled={loading} variant="outline">
								<Save className="h-4 w-4 mr-2" />
								{loading ? 'Saving...' : 'Save Draft'}
							</Button>
							<Button onClick={submit} disabled={loading}>
								<Send className="h-4 w-4 mr-2" />
								{loading ? 'Submitting...' : 'Submit'}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}


