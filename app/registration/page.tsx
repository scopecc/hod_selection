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
	const [user, setUser] = useState<{ name?: string; id?: string; programme?: string; department?: string } | null>(null);
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
	const [basket, setBasket] = useState('');
	const [remarks, setRemarks] = useState('');
	const [studentsPerSlot, setStudentsPerSlot] = useState<number | ''>('');
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editingSubmissionIdx, setEditingSubmissionIdx] = useState<number | null>(null);
	const [editSource, setEditSource] = useState<'entry' | 'submission' | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [prerequisites, setPrerequisites] = useState<string[]>([]);
	// Only one declaration at the top, remove any duplicates below
	// State for prerequisites search in multi-select Listbox
	const [prereqSearch, setPrereqSearch] = useState('');

	// State for submitted registrations search and edit
	const [searchSubmitted, setSearchSubmitted] = useState('');
	const [editingSubmittedIdx, setEditingSubmittedIdx] = useState<number | null>(null);
	const [editSubmittedEntry, setEditSubmittedEntry] = useState<any | null>(null);
	const handleEditSubmitted = (idx: number, entry: any) => {
		setEditingSubmittedIdx(idx);
		setEditSubmittedEntry({ ...entry });
	};
	const handleSaveSubmitted = async () => {
		if (editingSubmittedIdx === null || !editSubmittedEntry) return;
		// Prepare updated entries
		const updatedEntries = [...(existingRegistration?.registration?.entries || [])];
		updatedEntries[editingSubmittedIdx] = editSubmittedEntry;
		setEditingSubmittedIdx(null);
		setEditSubmittedEntry(null);
		setLoading(true);
		setMessage('');
		try {
			const response = await fetch('/api/registrations', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ entries: updatedEntries })
			});
			if (response.ok) {
				setMessage('Entry updated successfully!');
				mutateRegistration();
			} else {
				setMessage('Failed to update entry');
			}
		} catch {
			setMessage('Network error');
		} finally {
			setLoading(false);
		}
	};
	const handleDeleteSubmitted = async (idx: number) => {
		if (!window.confirm('Are you sure you want to delete this registration entry?')) return;
		setLoading(true);
		setMessage('');
		try {
			const updatedEntries = (existingRegistration?.registration?.entries || []).filter((_, i) => i !== idx);
			const response = await fetch('/api/registrations', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ entries: updatedEntries })
			});
			if (response.ok) {
				setMessage('Entry deleted successfully!');
				mutateRegistration();
			} else {
				setMessage('Failed to delete entry');
			}
		} catch {
			setMessage('Network error');
		} finally {
			setLoading(false);
		}
	};

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
			// When loading entries from draft, repopulate L,T,P,J from the current courses database
			const updatedEntries = (userDraft.draft.entries || []).map((entry: any) => {
				const course = coursesData?.courses?.find((c: any) => c.courseCode === entry.courseCode);
				return {
					...entry,
					L: course?.L ?? '-',
					T: course?.T ?? '-',
					P: course?.P ?? '-',
					J: course?.J ?? '-',
				};
			});
			setEntries(updatedEntries);
			// Do not reset batch here, keep user's selection
		} else {
			setEntries([]);
			// Do not reset batch here, keep user's selection
		}
	}, [userDraft, coursesData]);

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
		setBasket('');
		setRemarks('');
		setStudentsPerSlot('');
		setEditingIndex(null);
		setPrerequisites([]);
	};

	const filteredCourses = coursesData?.courses?.filter((c: any) =>
		c.courseName.toLowerCase().includes(prereqSearch.toLowerCase()) ||
		c.courseCode.toLowerCase().includes(prereqSearch.toLowerCase())
	) || [];


	// No calculation for L,T,P,J. Always use values from the selected course in the database.
	const addEntry = () => {
		if (!batch || !courseCode || !courseName || credits === '' || isNaN(Number(credits)) || !studentStrength || !fnSlots || !anSlots || !facultySchool || studentsPerSlot === '') return;
		const toTitleCase = (str: string): string => str ? str.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '';
		const totalSlots = Number(fnSlots) + Number(anSlots);
		const creditsNum = Number(credits);
		// Get L,T,P,J from the selected course in the database
		const selectedCourse = coursesData?.courses?.find((c: any) => c.courseCode === courseCode);
		const L = selectedCourse?.L ?? '-';
		const T = selectedCourse?.T ?? '-';
		const P = selectedCourse?.P ?? '-';
		const J = selectedCourse?.J ?? '-';
		const newEntry = {
			courseCode: courseCode.trim().toUpperCase(),
			courseName: toTitleCase(courseName),
			credits: creditsNum,
			group: toTitleCase(group),
			studentStrength: Number(studentStrength),
			fnSlots: Number(fnSlots),
			anSlots: Number(anSlots),
			totalSlots,
			studentsPerSlot: Number(studentsPerSlot),
			facultySchool: facultySchool.trim().toUpperCase(),
			batch: toTitleCase(batch),
			prerequisites: prerequisites.map(toTitleCase),
			basket: toTitleCase(basket),
			remarks: toTitleCase(remarks),
			L,
			T,
			P,
			J
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
		setBasket(entry.basket || '');
		setRemarks(entry.remarks || '');
		setStudentsPerSlot(entry.studentsPerSlot || '');
		setBatch(entry.batch);
		setEditingIndex(index);
		setPrerequisites(entry.prerequisites || []);
	};

	const deleteEntry = async (index: number) => {
		if (!window.confirm('Are you sure you want to delete this entry?')) return;
		const newEntries = entries.filter((_, i) => i !== index);
		setEntries(newEntries);
		if (editingIndex === index) {
			resetForm();
		}
		// Persist deletion to backend
		if (selectedDraft) {
			setLoading(true);
			try {
				await fetch('/api/user_drafts', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ draftId: selectedDraft, entries: newEntries })
				});
				mutateDraft();
			} catch {
				setMessage('Failed to delete entry from draft');
			} finally {
				setLoading(false);
			}
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
				mutateDraft(); // Refetch draft data so entries reload
				// Do NOT clear entries manually; let SWR refetch and update
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
	const facultySchoolOptions = ['SCOPE', 'SMEC', 'SENSE', 'SELECT', 'VIT-BS'];
	const basketOptions = ['Basket 1', 'Basket 2', 'Basket 3'];

		return (
			<div className="p-4 space-y-6 max-w-5xl mx-auto">
				{/* Improved Welcome Banner with Programme */}
				{user && (
					<>
					{console.log('USER SESSION OBJECT:', user)}
					<div className="mb-4 flex flex-col md:flex-row items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 shadow-sm">
						<div className="flex flex-col md:flex-row items-center gap-4">
							<span className="font-bold text-lg text-black-900">
								Welcome, {user.name} ({user.id})
								{user.programme ? (
									<span className="ml-2 text-blue-700 font-semibold">| Programme: {user.programme}</span>
								) : user.department ? (
									<span className="ml-2 text-blue-700 font-semibold">| Department: {user.department}</span>
								) : null}
							</span>
						</div>
						<Button variant="outline" onClick={handleLogout} className="mt-2 md:mt-0">Logout</Button>
					</div>
					</>
				)}
				{/* Message Display */}
				{message && (
					<div className={`p-3 rounded-lg text-center font-medium ${message.includes('successfully') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{message}</div>
				)}

				<Card>
					<CardHeader><CardTitle>Registration</CardTitle></CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-1 gap-6 items-start">
						{/* Draft Select - Listbox */}
						<div className="relative w-full">
							<label className="block mb-1 text-sm font-medium">Select Draft</label>
							<Listbox value={selectedDraft} onChange={val => { setSelectedDraft(val); setEntries([]); }}>
								<div className="relative">
									<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
										<span className="truncate text-left">
											{selectedDraft ? (draftsData?.drafts?.find((d: any) => d._id === selectedDraft)?.name || 'Draft Selected') : 'Select Draft'}
										</span>
										<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
									</Listbox.Button>
									<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
										{draftsData?.drafts?.map((d: any) => (
											<Listbox.Option key={d._id} value={d._id} className={({ active, selected }: { active: boolean; selected: boolean }) => `cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`}>{d.name} ({new Date(d.yearStart).getFullYear()}-{new Date(d.yearEnd).getFullYear()})</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle>{editingIndex !== null ? 'Edit Course' : 'Add Course'}</CardTitle></CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
						{/* Batch Select - Listbox (moved here) */}
						<div className="relative w-full">
							<label className="block mb-1 text-sm font-medium">Select Batch (Year Of Admission)</label>
							<Listbox value={batch} onChange={setBatch} disabled={!selectedDraft}>
								<div className="relative">
									<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
										<span className="truncate text-left">{batch || 'Select Batch'}</span>
										<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
									</Listbox.Button>
									<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
										{yearOptions.map(year => (
											<Listbox.Option key={year} value={year} className={({ active, selected }: { active: boolean; selected: boolean }) => `cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`}>{year}</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
						</div>
						{/* Course Select - Listbox */}
						<div className="relative w-full">
							<label className="block mb-1 text-sm font-medium">Select Course</label>
							{(() => {
								const [search, setSearch] = useState('');
								const filteredCourses = coursesData?.courses?.filter((c: any) =>
									c.courseName.toLowerCase().includes(search.toLowerCase()) || c.courseCode.toLowerCase().includes(search.toLowerCase())
								) || [];
								const selectedCourse = coursesData?.courses?.find((c: any) => c.courseCode === courseCode);
								return (
									<div className="relative w-full">
										<Listbox value={courseCode} onChange={setCourseCode} disabled={!coursesData?.courses?.length}>
											<div className="relative">
												<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
													<span className="truncate text-left">{selectedCourse ? `${selectedCourse.courseName} (${selectedCourse.courseCode})` : 'Select Course'}</span>
													<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
												</Listbox.Button>
												<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
													<div className="sticky top-0 bg-white dark:bg-zinc-900 px-2 py-2">
														<input type="text" className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" placeholder="Search course name/code..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
													</div>
													{filteredCourses.length ? (
														filteredCourses.map((c: any) => (
															<Listbox.Option key={c.courseCode} value={c.courseCode} className={({ active, selected }: { active: boolean; selected: boolean }) => `cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`}>{c.courseName} <span className="text-xs text-zinc-400">({c.courseCode})</span></Listbox.Option>
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
						</div>
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">Course Name</label>
							<Input placeholder="Course Name" value={courseName} readOnly />
						</div>
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">Credits</label>
							<Input placeholder="Credits" value={credits} readOnly />
						</div>
						{/* ...removed L T P J live preview from add course section... */}
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">Total Student Strength</label>
							<Input placeholder="Total Student Strength" value={studentStrength} onChange={e => setStudentStrength(Number(e.target.value) || '')} />
						</div>
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">Course Category (UG, OE, PC, PE)</label>
							<Input placeholder="Course Category" value={group} readOnly />
						</div>
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">FN Slots</label>
							<Input placeholder="FN Slots" value={fnSlots} onChange={e => setFnSlots(Number(e.target.value) || '')} />
						</div>
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">AN Slots</label>
							<Input placeholder="AN Slots" value={anSlots} onChange={e => setAnSlots(Number(e.target.value) || '')} />
						</div>
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">Number of Students per Slot</label>
							<Input placeholder="Number of Students per Slot" value={studentsPerSlot} onChange={e => setStudentsPerSlot(Number(e.target.value) || '')} />
						</div>
						<div className="flex flex-col gap-2">
							<label className="block mb-1 text-sm font-medium">Total Slots</label>
							<Input placeholder="Total Slots" value={(Number(fnSlots || 0) + Number(anSlots || 0)) || ''} readOnly />
						</div>
						{/* Faculty School Listbox */}
						<div className="relative w-full">
							<label className="block mb-1 text-sm font-medium">Course Handling School</label>
							<Listbox value={facultySchool} onChange={setFacultySchool}>
								<div className="relative">
									<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
										<span className="truncate text-left">{facultySchool ? facultySchool.toUpperCase() : 'Select Faculty School'}</span>
										<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
									</Listbox.Button>
									<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
										{facultySchoolOptions.map(option => (
											<Listbox.Option key={option} value={option} className={({ active, selected }: { active: boolean; selected: boolean }) => `cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`}>{option.toUpperCase()}</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
						</div>
						{/* Basket Listbox */}
						<div className="relative w-full">
							<label className="block mb-1 text-sm font-medium">Basket</label>
							<Listbox value={basket} onChange={setBasket}>
								<div className="relative">
									<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
										<span className="truncate text-left">{basket || 'Select Basket'}</span>
										<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
									</Listbox.Button>
									<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
										<Listbox.Option value="" className={({ active, selected }: { active: boolean; selected: boolean }) => `cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-red-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-red-700 dark:text-red-300' : ''}`}>None</Listbox.Option>
										{basketOptions.map(option => (
											<Listbox.Option key={option} value={option} className={({ active, selected }: { active: boolean; selected: boolean }) => `cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`}>{option}</Listbox.Option>
										))}
									</Listbox.Options>
								</div>
							</Listbox>
						</div>
						{/* Remarks Field */}
						<div className="relative w-full">
							<label className="block mb-1 text-sm font-medium">Remarks</label>
							<Input placeholder="Enter remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
						</div>
						{/* Prerequisites Multi-Select Listbox */}
						<div className="relative w-full md:col-span-3">
							<label className="block mb-1 text-sm font-medium">Pre-requisites</label>
							<Listbox value={prerequisites} onChange={setPrerequisites} multiple>
								<div className="relative">
									<Listbox.Button className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
										<span className="truncate text-left">{prerequisites.length === 0 ? 'Select prerequisites' : prerequisites.map(code => {
											const c = coursesData?.courses?.find((c: any) => c.courseCode === code);
											return c ? `${c.courseName} (${c.courseCode})` : code;
										}).join(', ')}</span>
										<svg className="w-4 h-4 ml-2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
									</Listbox.Button>
									<Listbox.Options className="absolute mt-1 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-md border border-input max-h-60 overflow-auto z-10">
										<div className="sticky top-0 bg-white dark:bg-zinc-900 px-2 py-2">
											<input type="text" className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" placeholder="Search course name/code..." value={prereqSearch} onChange={e => setPrereqSearch(e.target.value)} autoFocus />
										</div>
										{filteredCourses.length ? (
											filteredCourses.map((c: any) => (
												<Listbox.Option key={c.courseCode} value={c.courseCode} className={({ active, selected }: { active: boolean; selected: boolean }) => `cursor-pointer rounded-md px-3 py-2 mx-1 my-1 ${active ? 'bg-blue-100 dark:bg-zinc-800' : ''} ${selected ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}`}>{c.courseName} <span className="text-xs text-zinc-400">({c.courseCode})</span>{prerequisites.includes(c.courseCode) && <span className="ml-2 text-green-500">✓</span>}</Listbox.Option>
											))
										) : (
											<div className="px-3 py-2 text-zinc-400">No courses found</div>
										)}
									</Listbox.Options>
								</div>
							</Listbox>
							{/* Show selected prerequisites as removable chips */}
							<div className="flex flex-wrap gap-2 mt-2">
								{prerequisites.map(code => {
									const c = coursesData?.courses?.find((c: any) => c.courseCode === code);
									return (
										<span key={code} className="inline-flex items-center bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs">{c ? `${c.courseName} (${c.courseCode})` : code}<button type="button" className="ml-1 text-red-500 hover:text-red-700" onClick={() => setPrerequisites(prerequisites.filter(p => p !== code))}>&times;</button></span>
									);
								})}
							</div>
						</div>
						<div className="md:col-span-3 flex gap-2 mt-4">
							<Button onClick={addEntry} disabled={!batch || !courseCode || !courseName || !credits || !studentStrength || !fnSlots || !anSlots || !facultySchool} className="flex-1">{editingIndex !== null ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}{editingIndex !== null ? 'Update Course' : 'Add Course'}</Button>
							{editingIndex !== null && (<Button variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-2" />Cancel</Button>)}
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
										<TableHead>Course Category</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>L</TableHead>
										<TableHead>T</TableHead>
										<TableHead>P</TableHead>
										<TableHead>J</TableHead>
										<TableHead>C</TableHead>
										<TableHead>Strength</TableHead>
										<TableHead>FN</TableHead>
										<TableHead>AN</TableHead>
										<TableHead>Students/Slot</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Faculty School</TableHead>
										<TableHead>Basket</TableHead>
										<TableHead>Remarks</TableHead>
										<TableHead>Prerequisites</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedEntries.map((e, idx) => (
										<TableRow key={idx}>
											<TableCell className="font-medium">{e.batch}</TableCell>
											<TableCell>{e.group}</TableCell>
											<TableCell className="font-mono text-sm">{e.courseCode}</TableCell>
											<TableCell>{e.courseName}</TableCell>
											<TableCell>{typeof e.L !== 'undefined' ? e.L : '-'}</TableCell>
											<TableCell>{typeof e.T !== 'undefined' ? e.T : '-'}</TableCell>
											<TableCell>{typeof e.P !== 'undefined' ? e.P : '-'}</TableCell>
											<TableCell>{typeof e.J !== 'undefined' ? e.J : '-'}</TableCell>
											<TableCell>{e.credits}</TableCell>
											<TableCell>{e.studentStrength}</TableCell>
											<TableCell>{e.fnSlots}</TableCell>
											<TableCell>{e.anSlots}</TableCell>
											<TableCell>{e.studentsPerSlot ?? '-'}</TableCell>
											<TableCell className="font-semibold">{e.totalSlots}</TableCell>
											<TableCell>{e.facultySchool}</TableCell>
											<TableCell>{e.basket}</TableCell>
											<TableCell>{e.remarks}</TableCell>
											<TableCell>{Array.isArray(e.prerequisites) && e.prerequisites.length > 0 ? e.prerequisites.join(', ') : '-'}</TableCell>
											<TableCell className="space-x-2">
												<Button variant="outline" size="sm" onClick={() => editEntry(idx)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
												<Button variant="destructive" size="sm" onClick={() => deleteEntry(idx)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<div className="flex gap-2 mt-4">
								<Button onClick={saveDraft} disabled={loading} variant="outline"><Save className="h-4 w-4 mr-2" />{loading ? 'Saving...' : 'Save Draft'}</Button>
								<Button onClick={submit} disabled={loading}><Send className="h-4 w-4 mr-2" />{loading ? 'Submitting...' : 'Submit'}</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* My Submitted Registrations Section */}
				<Card className="mt-8">
					<CardHeader><CardTitle>My Submitted Registrations</CardTitle></CardHeader>
					<CardContent>
						{/* Search input for filtering registrations */}
						<div className="mb-4 flex justify-end">
							<Input
								placeholder="Search by course code, name, batch..."
								value={searchSubmitted || ''}
								onChange={e => setSearchSubmitted(e.target.value)}
								className="w-64"
							/>
						</div>
						{existingRegistration?.registration?.entries?.length ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Batch</TableHead>
										<TableHead>Course Code</TableHead>
										<TableHead>Course Name</TableHead>
										<TableHead>L</TableHead>
										<TableHead>T</TableHead>
										<TableHead>P</TableHead>
										<TableHead>J</TableHead>
										<TableHead>Credits</TableHead>
										<TableHead>Strength</TableHead>
										<TableHead>FN</TableHead>
										<TableHead>AN</TableHead>
										<TableHead>Faculty School</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{existingRegistration.registration.entries
										.filter(entry => {
											const q = (searchSubmitted || '').toLowerCase();
											return (
												entry.courseCode.toLowerCase().includes(q) ||
												entry.courseName.toLowerCase().includes(q) ||
												(entry.batch && entry.batch.toLowerCase().includes(q))
											);
										})
										.map((entry, idx) => (
											editingSubmittedIdx === idx ? (
												<TableRow key={idx}>
													<TableCell><Input value={editSubmittedEntry.batch} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, batch: e.target.value })} className="border rounded px-2 py-1 w-20" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.courseCode} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, courseCode: e.target.value })} className="border rounded px-2 py-1 w-24" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.courseName} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, courseName: e.target.value })} className="border rounded px-2 py-1 w-32" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.L} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, L: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.T} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, T: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.P} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, P: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.J} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, J: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.credits} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, credits: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.studentStrength} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, studentStrength: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.fnSlots} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, fnSlots: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.anSlots} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, anSlots: e.target.value })} className="border rounded px-2 py-1 w-10" /></TableCell>
													<TableCell><Input value={editSubmittedEntry.facultySchool} onChange={e => setEditSubmittedEntry({ ...editSubmittedEntry, facultySchool: e.target.value })} className="border rounded px-2 py-1 w-24" /></TableCell>
													<TableCell className="space-x-2">
														<Button variant="outline" size="sm" onClick={handleSaveSubmitted} disabled={loading}><Save className="h-3 w-3 mr-1" />Save</Button>
														<Button variant="destructive" size="sm" onClick={() => { setEditingSubmittedIdx(null); setEditSubmittedEntry(null); }}><Trash2 className="h-3 w-3 mr-1" />Cancel</Button>
													</TableCell>
												</TableRow>
											) : (
												<TableRow key={idx}>
													<TableCell className="font-medium">{entry.batch}</TableCell>
													<TableCell>{entry.courseCode}</TableCell>
													<TableCell>{entry.courseName}</TableCell>
													<TableCell>{entry.L}</TableCell>
													<TableCell>{entry.T}</TableCell>
													<TableCell>{entry.P}</TableCell>
													<TableCell>{entry.J}</TableCell>
													<TableCell>{entry.credits}</TableCell>
													<TableCell>{entry.studentStrength}</TableCell>
													<TableCell>{entry.fnSlots}</TableCell>
													<TableCell>{entry.anSlots}</TableCell>
													<TableCell>{entry.facultySchool}</TableCell>
													<TableCell className="space-x-2">
														<Button variant="outline" size="sm" onClick={() => handleEditSubmitted(idx, entry)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
														<Button variant="destructive" size="sm" onClick={() => handleDeleteSubmitted(idx)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
													</TableCell>
												</TableRow>
											)
										))}
								</TableBody>
							</Table>
						) : (
							<div className="text-gray-500">No registrations submitted yet for this draft.</div>
						)}
					</CardContent>
				</Card>
			</div>
		);
}


