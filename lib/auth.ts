import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from './mongodb';
import { findEmployeeById } from './employee';
import { verifyOTP, isOTPExpired } from './otp';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      id: 'employee-id',
      name: 'Employee ID',
      credentials: {
        employeeId: { label: 'Employee ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.employeeId) {
          throw new Error('Employee ID is required');
        }

        try {
          // Find employee by ID
          const employee = await findEmployeeById(credentials.employeeId);
          
          if (!employee) {
            throw new Error('Employee not found');
          }

          // Return employee data for OTP generation step
          return {
            id: employee.employeeId,
            email: employee.email,
            name: employee.name,
            department: employee.department,
          };
        } catch (error) {
          console.error('Employee ID authorization error:', error);
          throw error;
        }
      }
    }),
    CredentialsProvider({
      id: 'otp-verification',
      name: 'OTP Verification',
      credentials: {
        employeeId: { label: 'Employee ID', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.employeeId || !credentials?.otp) {
          throw new Error('Employee ID and OTP are required');
        }

        try {
          const client = await clientPromise;
          const db = client.db();
          const otpCollection = db.collection('otps');

          // Find the OTP record for this employee
          const otpRecord = await otpCollection.findOne({
            employeeId: credentials.employeeId,
          });

          if (!otpRecord) {
            throw new Error('OTP not found or expired');
          }

          // Check if OTP has expired
          if (isOTPExpired(otpRecord.expiresAt)) {
            // Clean up expired OTP
            await otpCollection.deleteOne({ employeeId: credentials.employeeId });
            throw new Error('OTP has expired');
          }

          // Verify the OTP
          const isValidOTP = verifyOTP(credentials.otp, otpRecord.hashedOTP);
          
          if (!isValidOTP) {
            throw new Error('Invalid OTP');
          }

          // OTP is valid, get employee data
          const employee = await findEmployeeById(credentials.employeeId);
          
          if (!employee) {
            throw new Error('Employee not found');
          }

          // Clean up used OTP
          await otpCollection.deleteOne({ employeeId: credentials.employeeId });

          return {
            id: employee.employeeId,
            email: employee.email,
            name: employee.name,
            department: employee.department,
          };
        } catch (error) {
          console.error('OTP verification error:', error);
          throw error;
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.department = user.department;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.department = token.department as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};