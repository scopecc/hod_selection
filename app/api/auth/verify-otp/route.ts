import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, otp } = await request.json();

    if (!employeeId || !otp) {
      return NextResponse.json(
        { error: 'Employee ID and OTP are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await getDatabase();
    
    // Find OTP record
    const otpRecord = await db.collection('otps').findOne({ employeeId });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No OTP found for this employee' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    const now = new Date();
    if (now > otpRecord.expiryTime) {
      // Clean up expired OTP
      await db.collection('otps').deleteOne({ employeeId });
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, otpRecord.hashedOTP);

    if (!isValidOTP) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // OTP is valid - clean up and return success
    await db.collection('otps').deleteOne({ employeeId });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}