'use client';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Save, Send, Plus, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RegistrationPage() {
	const { data: draftsData } = useSWR('/api/drafts', fetcher);
	const [selectedDraft, setSelectedDraft] = useState('');
	const [batch, setBatch] = useState('');
	const { data: coursesData } = useSWR(() => selectedDraft ? `/api/courses?draftId=${encodeURIComponent(selectedDraft)}` : null, fetcher);
	const [entries, setEntries] = useState<any[]>([]);
	const [courseCode, setCourseCode] = useState('');
	const [courseName, setCourseName] = useState('');
	const [credits, setCredits] = useState<number | ''>('');
	const [studentStrength, setStudentStrength] = useState<number | ''>('');
	const [fnSlots, setFnSlots] = useState<number | ''>('');
	const [anSlots, setAnSlots] = useState<number | ''>('');
	const [facultySchool, setFacultySchool] = useState('');
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');

	// Load existing registration if available
	const { data: existingRegistration, mutate } = useSWR(
		() => selectedDraft ? `/api/registrations?draftId=${encodeURIComponent(selectedDraft)}` : null, 
		fetcher
	);

	useEffect(() => {
		if (existingRegistration?.registration) {
			setEntries(existingRegistration.registration.entries || []);
			setBatch(existingRegistration.registration.batch || '');
		} else {
			setEntries([]);
			setBatch('');
		}
	}, [existingRegistration]);

	useEffect(() => {
		if (!courseCode) { setCourseName(''); setCredits(''); return; }
		const c = coursesData?.courses?.find((c: any) => c.courseCode === courseCode);
		if (c) { setCourseName(c.courseName); setCredits(c.credits); }
	}, [courseCode, coursesData]);

	const resetForm = () => {
		setCourseCode('');
		setCourseName('');
		setCredits('');
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
		setStudentStrength(entry.studentStrength);
		setFnSlots(entry.fnSlots);
		setAnSlots(entry.anSlots);
		setFacultySchool(entry.facultySchool);
		setBatch(entry.batch || batch);
		setEditingIndex(index);
	};

	const deleteEntry = (index: number) => {
		const newEntries = entries.filter((_, i) => i !== index);
		setEntries(newEntries);
		if (editingIndex === index) {
			resetForm();
		}
	};

	const save = async (status: 'draft' | 'submitted') => {
		if (!selectedDraft || !batch || entries.length === 0) {
			setMessage('Please select a draft, batch, and add at least one course');
			return;
		}

		setLoading(true);
		setMessage('');

		try {
			const response = await fetch('/api/registrations', { 
				method: 'POST', 
				headers: { 'content-type': 'application/json' }, 
				body: JSON.stringify({ draftId: selectedDraft, batch, entries, status }) 
			});

			if (response.ok) {
				setMessage(status === 'submitted' ? 'Registration submitted successfully!' : 'Draft saved successfully!');
				mutate(); // Refresh the data
				if (status === 'submitted') {
					// Clear form after successful submission
					setEntries([]);
					setBatch('');
				}
			} else {
				const error = await response.json();
				setMessage(error.error || 'Failed to save registration');
			}
		} catch (error) {
			setMessage('Network error occurred');
		} finally {
			setLoading(false);
		}
	};

	const submit = async () => {
		await save('submitted');
	};

	const saveDraft = async () => {
		await save('draft');
	};

	// Sort entries by batch in ascending order
	const sortedEntries = useMemo(() => {
		return [...entries].sort((a, b) => {
			const batchA = a.batch || batch;
			const batchB = b.batch || batch;
			return Number(batchA) - Number(batchB);
		});
	}, [entries, batch]);

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
					<input list="course-codes" className="border rounded p-2" placeholder="Course Code" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
					<datalist id="course-codes">
						{coursesData?.courses?.map((c: any) => <option key={c.courseCode} value={c.courseCode}>{c.courseName}</option>)}
					</datalist>
					<Input placeholder="Course Name" value={courseName} readOnly />
					<Input placeholder="Credits" value={credits} readOnly />
					<Input placeholder="Total Student Strength" value={studentStrength} onChange={e => setStudentStrength(Number(e.target.value) || '')} />
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
										<TableCell className="font-medium">{e.batch || batch}</TableCell>
										<TableCell className="font-mono text-sm">{e.courseCode}</TableCell>
										<TableCell>{e.courseName}</TableCell>
										<TableCell>{e.credits}</TableCell>
										<TableCell>{e.studentStrength}</TableCell>
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


