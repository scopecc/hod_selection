
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '@/lib/email';
import { maskEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Connect to database

    const db = await getDatabase();
    const dbName = db.databaseName || process.env.MONGODB_DB;
    // List all databases
    
    const employeesCol = db.collection('VIT_Auth');
    const collectionName = employeesCol.collectionName;
    const allEmployees = await employeesCol.find({}).toArray();

    // Try to match both plain number and EMPxxx formats
    let employee = await employeesCol.findOne({ employeeId });
    
    if (!employee && /^\d+$/.test(employeeId)) {
      // Try EMPxxx format if only number provided
      const padded = employeeId.padStart(3, '0');
      const empFormat = `EMP${padded}`;
      employee = await employeesCol.findOne({ employeeId: empFormat });
    }
    if (!employee && /^EMP\d+$/.test(employeeId)) {
      // Try plain number if EMPxxx provided
      const numPart = employeeId.replace(/^EMP/, '').replace(/^0+/, '');
      employee = await employeesCol.findOne({ employeeId: numPart });
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Hash the OTP
    const hashedOTP = await bcrypt.hash(otp, 12);
    // Set expiry time
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);

    // Ensure TTL index exists (expires after OTP expiry + 1 minute buffer)
    try {
      await db.collection('otps').createIndex({ createdAt: 1 }, { expireAfterSeconds: (expiryMinutes + 1) * 60 });
    } catch {}

    // Save OTP to database
    await db.collection('otps').deleteMany({ employeeId: employee.employeeId });
    const otpDoc = {
      employeeId: employee.employeeId,
      hashedOTP,
      expiresAt: expiryTime, // Changed from expiryTime to expiresAt
      createdAt: new Date(),
    };
    await db.collection('otps').insertOne(otpDoc);

    // Send OTP email
  await sendOTPEmail(employee.email, otp, employee.employeeId, employee.name);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      maskedEmail: maskEmail(employee.email),
      employeeId: employee.employeeId,
    });

  } catch (error) {
    console.error('Error in request-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}