import { NextResponse } from 'next/server';
import { requireAdminFromRequest } from '@/lib/admin';
import { getDatabase } from '@/lib/mongodb';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
	if (!requireAdminFromRequest(req)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await req.json();
		const { draftId, userId } = body;

		if (!draftId) {
			return NextResponse.json({ error: 'draftId required' }, { status: 400 });
		}

		const db = await getDatabase();
		const query: any = { draftId, status: 'submitted' };
		if (userId) query.userId = userId;
		const registrations = await db.collection('registrations')
			.find(query)
			.toArray();

		if (registrations.length === 0) {
			return NextResponse.json({ error: 'No registrations found' }, { status: 404 });
		}

		// Prepare data for Excel
		const excelData: any[] = [];
		const isGlobal = !userId;
		registrations.forEach((reg, regIdx) => {
			reg.entries.forEach((entry: any, entryIdx: number) => {
				// Calculate L, T, P, J if not present
				let L = entry.L ?? 0, T = entry.T ?? 0, P = entry.P ?? 0, J = entry.J ?? 0;
				const code = String(entry.courseCode || '').trim().toUpperCase();
				const creditsNum = Number(entry.credits || 0);
				if (L === 0 && T === 0 && P === 0 && J === 0) {
					if (code.endsWith('L')) {
						L = creditsNum;
						T = 0;
						P = 0;
						J = 0;
					} else if (code.endsWith('J')) {
						J = creditsNum * 4;
						L = 0;
						T = 0;
						P = 0;
					} else if (code.endsWith('P')) {
						P = creditsNum * 2;
						L = 0;
						T = 0;
						J = 0;
					}
				}
				const studentStrengthPerSlot = typeof entry.studentsPerSlot !== 'undefined' && entry.studentsPerSlot !== null
					? entry.studentsPerSlot
					: (entry.totalSlots ? Math.round(Number(entry.studentStrength) / Number(entry.totalSlots)) : '');
				// Unified row structure (no Username/User ID). Follow requested order and rename headers.
				const row: any = {
					'SNO.': excelData.length + 1,
					'Stream': reg.programme || '',
					'Course Type': entry.group || '',
					'Course Code': entry.courseCode,
					'Course Title': entry.courseName,
					'L': L,
					'T': T,
					'P': P,
					'J': J,
					'C': entry.credits,
					'Course Handling School': entry.facultySchool,
					'No of FN slots': entry.fnSlots,
					'No of AN Slots': entry.anSlots,
					'Total Slots': entry.totalSlots,
					'Student per slot strength': studentStrengthPerSlot,
					'Student Str': entry.studentStrength,
					// keep remaining fields as before
					'Pre-requisites': Array.isArray(entry.prerequisites) && entry.prerequisites.length > 0 ? entry.prerequisites.join(', ') : '',
					'Basket': entry.basket || '',
					'Remarks': entry.remarks || '',
					'Status': reg.status,
					'Submitted Date': reg.updatedAt ? new Date(reg.updatedAt).toLocaleString() : ''
				};
				excelData.push(row);
			});
		});

		// Get username, userId, and draft name for filename
		let fileName = `registrations_${draftId}.xlsx`;
		try {
			const db = await getDatabase();
			const draft = await db.collection('drafts').findOne({ _id: draftId });
			const reg0 = registrations[0];
			if (draft) {
				// Clean for filename (omit user info)
				const safe = (s: string) => String(s || '').replace(/[^a-zA-Z0-9-_]/g, '_');
				fileName = `${safe(draft.name)}.xlsx`;
			}
		} catch {}

		// Create workbook and worksheet
		const workbook = XLSX.utils.book_new();
		// Dynamically set column widths based on content
		const worksheet = XLSX.utils.json_to_sheet(excelData);
		const keys = Object.keys(excelData[0] || {});
		worksheet['!cols'] = keys.map(key => {
			const maxLen = Math.max(key.length, ...excelData.map(row => String(row[key] || '').length));
			return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
		});

		// Add worksheet to workbook
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

		// Generate Excel file buffer
		const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		// Return Excel file
		return new NextResponse(excelBuffer, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="${fileName}"`
			}
		});

	} catch (error) {
		console.error('Error generating Excel file:', error);
		return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
	}
}
