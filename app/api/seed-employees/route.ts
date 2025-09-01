import { NextResponse } from 'next/server';
import { seedEmployeeData } from '@/lib/employee';

export async function POST() {
  try {
    await seedEmployeeData();
    return NextResponse.json({ message: 'Employee data seeded successfully' });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed employee data' },
      { status: 500 }
    );
  }
}