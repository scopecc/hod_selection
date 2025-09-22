import { NextAuthOptions, Session } from 'next-auth';
// Extend the Session type to include custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      department?: string;
      programme?: string;
      role?: string;
    };
  }
}
import { MongoDBAdapter } from "@auth/mongodb-adapter";
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
            programme: employee.programme,
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
          const { getDatabase } = await import('./mongodb');
          const db = await getDatabase();
          const otpCollection = db.collection('otps');

          // Find the OTP record for this employee
          const otpRecord = await otpCollection.findOne({
            employeeId: credentials.employeeId,
          });
          if (otpRecord) {
          }

          if (!otpRecord) {
            // Let's also check if there are any OTPs in the collection
            const allOtps = await otpCollection.find({}).toArray();
            throw new Error('OTP not found or expired');
          }

          // Check if OTP has expired
          const isExpired = isOTPExpired(otpRecord.expiresAt);
          if (isExpired) {
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
            programme: employee.programme,
          };
        } catch (error) {
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
    maxAge: 24 * 60 * 60, 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        Object.assign(token, user);
        token.role = (user as any).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.department = token.department as string;
        session.user.programme = token.programme as string;
        session.user.role = (token as any).role as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};