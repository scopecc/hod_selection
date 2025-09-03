import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

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
    console.log('[DEBUG][verify-otp] Looking for employeeId:', employeeId);
    const otpRecord = await db.collection('otps').findOne({ employeeId });
    console.log('[DEBUG][verify-otp] Found OTP record:', otpRecord ? 'YES' : 'NO');
    
    if (!otpRecord) {
      // Let's also check if there are any OTPs in the collection
      const allOtps = await db.collection('otps').find({}).toArray();
      console.log('[DEBUG][verify-otp] All OTPs in collection:', allOtps.length);
      return NextResponse.json(
        { error: 'No OTP found for this employee' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    const now = new Date();
    if (now > otpRecord.expiresAt) {
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

    // OTP is valid - return success but DON'T delete OTP yet
    // NextAuth will delete it after successful authentication
    console.log('[DEBUG][verify-otp] OTP is valid, returning success');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}