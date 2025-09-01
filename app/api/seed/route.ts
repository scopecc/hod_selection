import { NextResponse } from 'next/server';
import { seedEmployeeData } from '@/lib/employee';

/**
 * API route to seed employee data for development
 * This should only be used in development environment
 */
export async function POST() {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Seeding only allowed in development' },
        { status: 403 }
      );
    }

    await seedEmployeeData();
    return NextResponse.json({ 
      message: 'Employee data seeded successfully',
      employees: [
        'EMP001 - John Doe (Engineering)',
        'EMP002 - Jane Smith (Marketing)',
        'EMP003 - Mike Johnson (Sales)',
        'EMP004 - Sarah Wilson (HR)',
        'EMP005 - David Brown (Finance)',
      ]
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed employee data' },
      { status: 500 }
    );
  }
}