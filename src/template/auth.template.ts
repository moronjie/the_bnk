export function otpEmailTemplate(otp: string, expiryMinutes = 10): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;">
    <h2 style="color: #1a1a2e; margin-bottom: 8px;">Verify your email</h2>
    <p style="color: #555; margin-bottom: 24px;">
      Use the code below to verify your email address. It expires in
      <strong>${expiryMinutes} minutes</strong>.
    </p>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center;
                color: #1a1a2e; background: #f0f4ff; border-radius: 8px; padding: 16px 24px;
                margin-bottom: 24px;">
      ${otp}
    </div>
    <p style="color: #888; font-size: 13px;">
      If you did not request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function passwordResetEmailTemplate(otp: string, expiryMinutes = 10): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;">
    <h2 style="color: #1a1a2e; margin-bottom: 8px;">Reset your password</h2>
    <p style="color: #555; margin-bottom: 24px;">
      Use the code below to reset your password. It expires in
      <strong>${expiryMinutes} minutes</strong>.
    </p>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center;
                color: #1a1a2e; background: #fff0f0; border-radius: 8px; padding: 16px 24px;
                margin-bottom: 24px;">
      ${otp}
    </div>
    <p style="color: #888; font-size: 13px;">
      If you did not request a password reset, please secure your account immediately.
    </p>
  </div>
</body>
</html>
  `.trim();
}
