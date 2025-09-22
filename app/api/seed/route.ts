import { NextResponse } from 'next/server';


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

    return NextResponse.json({ 
      error: 'Seeding not implemented: seedEmployeeData is missing.'
    }, { status: 500 });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed employee data' },
      { status: 500 }
    );
  }
}