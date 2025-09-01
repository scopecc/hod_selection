import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface OTPData {
  otp: string;
  hashedOTP: string;
  expiresAt: Date;
}

/**
 * Generate a 6-digit OTP and return both plain and hashed versions
 * @returns Object containing plain OTP, hashed OTP, and expiration time
 */
export function generateOTP(): OTPData {
  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Hash the OTP for secure storage
  const saltRounds = 10;
  const hashedOTP = bcrypt.hashSync(otp, saltRounds);
  
  // Set expiration time to 1 minutes from now
  const expiresAt = new Date(Date.now() + 1 * 60 * 1000);
  
  return {
    otp,
    hashedOTP,
    expiresAt,
  };
}

/**
 * Verify an OTP against its hashed version
 * @param plainOTP - The OTP entered by the user
 * @param hashedOTP - The hashed OTP stored in the database
 * @returns Boolean indicating if OTP is valid
 */
export function verifyOTP(plainOTP: string, hashedOTP: string): boolean {
  try {
    return bcrypt.compareSync(plainOTP, hashedOTP);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

/**
 * Check if an OTP has expired
 * @param expiresAt - The expiration timestamp
 * @returns Boolean indicating if OTP is expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}