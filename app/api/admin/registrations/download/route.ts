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
		registrations.forEach((reg, regIdx) => {
			reg.entries.forEach((entry: any, entryIdx: number) => {
				excelData.push({
					'SNO.': excelData.length + 1,
					'Department': reg.department || '',
					'Batch': entry.batch,
					'Course Code': entry.courseCode,
					'Course Name': entry.courseName,
					'Credits': entry.credits,
					'Group': entry.group || '',
					'Student Strength': entry.studentStrength,
					'FN Slots': entry.fnSlots,
					'AN Slots': entry.anSlots,
					'Total Slots': entry.totalSlots,
					'Faculty School': entry.facultySchool,
					'Prerequisites': Array.isArray(entry.prerequisites) && entry.prerequisites.length > 0 ? entry.prerequisites.join(', ') : '',
					'Status': reg.status,
					'Submitted Date': reg.updatedAt ? new Date(reg.updatedAt).toLocaleString() : ''
				});
			});
		});

		// Get username, userId, and draft name for filename
		let fileName = `registrations_${draftId}.xlsx`;
		try {
			const db = await getDatabase();
			const draft = await db.collection('drafts').findOne({ _id: draftId });
			const reg0 = registrations[0];
			if (reg0 && draft) {
				// Clean for filename
				const safe = (s: string) => String(s || '').replace(/[^a-zA-Z0-9-_]/g, '_');
				fileName = `${safe(reg0.userName)}_${safe(reg0.userId)}_${safe(draft.name)}.xlsx`;
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
