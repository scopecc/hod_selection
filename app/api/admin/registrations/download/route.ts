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
		
				registrations.forEach((reg) => {
					reg.entries.forEach((entry: any) => {
						excelData.push({
							'User ID': reg.userId,
							'User Name': reg.userName,
							'Department': reg.department,
							'Batch': reg.batch,
							'Course Code': entry.courseCode,
							'Course Name': entry.courseName,
							'Credits': entry.credits,
							'Student Strength': entry.studentStrength,
							'FN Slots': entry.fnSlots,
							'AN Slots': entry.anSlots,
							'Total Slots': entry.totalSlots,
							'Faculty School': entry.facultySchool,
							'Status': reg.status,
							'Submitted Date': reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString() : ''
						});
					});
				});

		// Create workbook and worksheet
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet(excelData);

		// Set column widths
		const columnWidths = [
			{ wch: 15 }, // User ID
			{ wch: 25 }, // User Name
			{ wch: 15 }, // Department
			{ wch: 10 }, // Batch
			{ wch: 15 }, // Course Code
			{ wch: 40 }, // Course Name
			{ wch: 10 }, // Credits
			{ wch: 15 }, // Student Strength
			{ wch: 12 }, // FN Slots
			{ wch: 12 }, // AN Slots
			{ wch: 12 }, // Total Slots
			{ wch: 15 }, // Faculty School
			{ wch: 12 }, // Status
			{ wch: 15 }  // Submitted Date
		];
		worksheet['!cols'] = columnWidths;

		// Add worksheet to workbook
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

		// Generate Excel file buffer
		const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		// Return Excel file
		return new NextResponse(excelBuffer, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="registrations_${draftId}.xlsx"`
			}
		});

	} catch (error) {
		console.error('Error generating Excel file:', error);
		return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
	}
}
