'use client';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

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

	useEffect(() => {
		if (!courseCode) { setCourseName(''); setCredits(''); return; }
		const c = coursesData?.courses?.find((c: any) => c.courseCode === courseCode);
		if (c) { setCourseName(c.courseName); setCredits(c.credits); }
	}, [courseCode, coursesData]);

	const addEntry = () => {
		if (!batch || !courseCode || !courseName || !credits || !studentStrength || !fnSlots || !anSlots || !facultySchool) return;
		const totalSlots = Number(fnSlots) + Number(anSlots);
		setEntries([...entries, { courseCode, courseName, credits: Number(credits), studentStrength: Number(studentStrength), fnSlots: Number(fnSlots), anSlots: Number(anSlots), totalSlots, facultySchool }]);
		setCourseCode(''); setCourseName(''); setCredits(''); setStudentStrength(''); setFnSlots(''); setAnSlots(''); setFacultySchool('');
	};

	const save = async (status: 'draft' | 'submitted') => {
		if (!selectedDraft || !batch) return;
		await fetch('/api/registrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ draftId: selectedDraft, batch, entries, status }) });
		alert(status === 'submitted' ? 'Submitted' : 'Saved');
	};

	const selectedYearRange = useMemo(() => {
		const d = draftsData?.drafts?.find((d: any) => d._id === selectedDraft);
		return d ? `${new Date(d.yearStart).getFullYear()}-${new Date(d.yearEnd).getFullYear()}` : '';
	}, [selectedDraft, draftsData]);

	return (
		<div className="p-4 space-y-4">
			<Card>
				<CardHeader><CardTitle>Registration</CardTitle></CardHeader>
				<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<select className="border rounded p-2" value={selectedDraft} onChange={e => { setSelectedDraft(e.target.value); setBatch(''); }}>
						<option value="">Select Draft</option>
						{draftsData?.drafts?.map((d: any) => <option key={d._id} value={d._id}>{d.name} ({new Date(d.yearStart).getFullYear()}-{new Date(d.yearEnd).getFullYear()})</option>)}
					</select>
					<select className="border rounded p-2" value={batch} onChange={e => setBatch(e.target.value)} disabled={!selectedDraft}>
						<option value="">Select Batch</option>
						{selectedDraft && (() => { const d = draftsData?.drafts?.find((x: any) => x._id === selectedDraft); if (!d) return null; const range: string[] = [`${new Date(d.yearStart).getFullYear()}-${new Date(d.yearEnd).getFullYear()}`]; return range.map(r => <option key={r} value={r}>{r}</option>); })()}
					</select>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Add Course</CardTitle></CardHeader>
				<CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
					<Input placeholder="Faculty Handling School" value={facultySchool} onChange={e => setFacultySchool(e.target.value)} />
					<div className="md:col-span-4"><Button onClick={addEntry}>Add Another</Button></div>
				</CardContent>
			</Card>

			{entries.length > 0 && (
				<Card>
					<CardHeader><CardTitle>Entries</CardTitle></CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Credits</TableHead><TableHead>Strength</TableHead><TableHead>FN</TableHead><TableHead>AN</TableHead><TableHead>Total</TableHead><TableHead>School</TableHead></TableRow>
							</TableHeader>
							<TableBody>
								{entries.map((e, idx) => (
									<TableRow key={idx}><TableCell>{e.courseCode}</TableCell><TableCell>{e.courseName}</TableCell><TableCell>{e.credits}</TableCell><TableCell>{e.studentStrength}</TableCell><TableCell>{e.fnSlots}</TableCell><TableCell>{e.anSlots}</TableCell><TableCell>{e.totalSlots}</TableCell><TableCell>{e.facultySchool}</TableCell></TableRow>
								))}
							</TableBody>
						</Table>
						<div className="flex gap-2 mt-4">
							<Button onClick={() => save('draft')}>Save Draft</Button>
							<Button onClick={() => save('submitted')}>Submit</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}


