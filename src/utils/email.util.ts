import transporter from '../config/nodemailer.config';
import { otpEmailTemplate, passwordResetEmailTemplate } from '../template/auth.template';

const FROM = `"BankApp" <${process.env.EMAIL_USER || 'noreply@bankapp.com'}>`;

export async function sendEmailVerificationOtp(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Your BankApp verification code',
    html: otpEmailTemplate(otp),
  });
}

export async function sendPasswordResetOtp(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Your BankApp password reset code',
    html: passwordResetEmailTemplate(otp),
  });
}
