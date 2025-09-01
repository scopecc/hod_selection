
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { sendOTPEmail, maskEmail } from '@/lib/email';

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
    try {
      // Get the underlying MongoClient from the db object
      // @ts-ignore
      const client = db.s && db.s.client ? db.s.client : (db.topology && db.topology.s && db.topology.s.coreTopology && db.topology.s.coreTopology.s && db.topology.s.coreTopology.s.client);
      if (client) {
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('[DEBUG][request-otp] All databases:', (dbs.databases as {name: string}[]).map((d: {name: string}) => d.name));
      } else {
        console.log('[DEBUG][request-otp] Could not get MongoClient from db');
      }
    } catch (e) {
      console.log('[DEBUG][request-otp] Could not list databases:', e);
    }
    // List all collections in current db
    try {
      const collections = await db.listCollections().toArray();
      console.log('[DEBUG][request-otp] Collections in DB', dbName, ':', collections.map(c => c.name));
    } catch (e) {
      console.log('[DEBUG][request-otp] Could not list collections:', e);
    }
    const employeesCol = db.collection('VIT_Auth');
    const collectionName = employeesCol.collectionName;
    console.log('[DEBUG][request-otp] Connected to DB:', dbName);
    console.log('[DEBUG][request-otp] Using collection:', collectionName);
    const allEmployees = await employeesCol.find({}).toArray();
    console.log('[DEBUG][request-otp] All employees:', allEmployees);
    console.log('[DEBUG][request-otp] Searching for employeeId:', employeeId);

    // Try to match both plain number and EMPxxx formats
    let employee = await employeesCol.findOne({ employeeId });
    if (!employee && /^\d+$/.test(employeeId)) {
      // Try EMPxxx format if only number provided
      const padded = employeeId.padStart(3, '0');
      const empFormat = `EMP${padded}`;
      console.log('[DEBUG][request-otp] Trying EMP format:', empFormat);
      employee = await employeesCol.findOne({ employeeId: empFormat });
    }
    if (!employee && /^EMP\d+$/.test(employeeId)) {
      // Try plain number if EMPxxx provided
      const numPart = employeeId.replace(/^EMP/, '').replace(/^0+/, '');
      console.log('[DEBUG][request-otp] Trying numeric format:', numPart);
      employee = await employeesCol.findOne({ employeeId: numPart });
    }

    if (!employee) {
      console.log('[DEBUG][request-otp] Employee not found for:', employeeId);
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
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + parseInt(process.env.OTP_EXPIRY_MINUTES || '5'));

    // Save OTP to database
    await db.collection('otps').deleteMany({ employeeId: employee.employeeId }); // Remove any existing OTPs for this employee
    await db.collection('otps').insertOne({
      employeeId: employee.employeeId,
      hashedOTP,
      expiryTime,
      createdAt: new Date(),
    });

    // Send OTP email
    await sendOTPEmail(employee.email, otp, employee.employeeId);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      maskedEmail: maskEmail(employee.email),
    });

  } catch (error) {
    console.error('Error in request-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}