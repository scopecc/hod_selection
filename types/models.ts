export type DraftStatus = 'open' | 'closed';

export interface Draft {
	_id?: string;
	name: string;
	yearStart: number;
	yearEnd: number;
	status: DraftStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface Course {
	_id?: string;
	draftId: string; // references Draft._id
	courseCode: string;
	courseName: string;
	credits: number;
}

export interface RegistrationEntry {
	courseCode: string;
	courseName: string;
	credits: number;
	studentStrength: number;
	fnSlots: number;
	anSlots: number;
	totalSlots: number; // fn + an
	facultySchool: string;
}

export interface Registration {
	_id?: string;
	draftId: string;
	userId: string; // employee id
	userName: string;
	department: string;
	batch: string; // e.g., 2022-2026
	entries: RegistrationEntry[];
	status: 'draft' | 'submitted';
	createdAt: Date;
	updatedAt: Date;
}

export interface EmployeeUser {
	_id?: string;
	name: string;
	employeeId: string;
	email: string;
	department: string;
}


