import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string, employeeId: string, employeeName: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your OTP for Login',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Login Verification</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Hello <strong>${employeeName || ''} ${employeeId}</strong>,
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Your OTP for login verification is:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="background-color: #f0f0f0; padding: 15px 25px; font-size: 24px; font-weight: bold; color: #333; border-radius: 6px; letter-spacing: 3px;">${otp}</span>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes. Please do not share this code with anyone.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  const maskedLocal = `${localPart.substring(0, 2)}***${localPart.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}