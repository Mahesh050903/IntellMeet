import nodemailer, { type Transporter } from 'nodemailer';

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return this.transporter;
    }

    return null;
  }

  public static async sendOtpEmail(toEmail: string, otpCode: string, purpose: 'login' | 'register' | 'forgot-password' = 'login'): Promise<{ delivered: boolean; devOtp?: string }> {
    if (process.env.NODE_ENV === 'test') {
      return { delivered: true, devOtp: otpCode };
    }

    const transporter = this.getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"IntellMeet Security" <no-reply@intellmeet.com>';
    const actionLabel = purpose === 'register' ? 'Account Registration' : purpose === 'forgot-password' ? 'Password Reset' : 'Account Login';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d12; color: #f4f4f5; margin: 0; padding: 20px; }
          .container { max-width: 480px; margin: 0 auto; background: #161820; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 700; color: #f4f4f5; letter-spacing: -0.5px; }
          .brand span { color: #10b981; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 8px; }
          .otp-box { background: #0f1016; border: 1px dashed rgba(99, 102, 241, 0.4); border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: 'Courier New', Courier, monospace; }
          .text { font-size: 14px; color: #94a3b8; line-height: 1.6; text-align: center; }
          .footer { margin-top: 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">Intell<span>Meet</span></div>
            <div class="badge">${actionLabel} Verification</div>
          </div>
          <p class="text">
            Hello, please use the following 6-digit verification code to complete your ${actionLabel.toLowerCase()}. This code is valid for <strong>5 minutes</strong>.
          </p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>
          <p class="text" style="font-size: 12px; color: #64748b;">
            If you did not request this verification code, please ignore this email or secure your account.
          </p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} IntellMeet. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: `${otpCode} is your IntellMeet verification code`,
          html: htmlContent,
          text: `Your IntellMeet ${actionLabel} OTP code is: ${otpCode}. Valid for 5 minutes.`,
        });
        console.log(`[EmailService] OTP email successfully sent to ${toEmail}`);
        return { delivered: true };
      } catch (err) {
        console.warn(`[EmailService] SMTP delivery failed to ${toEmail}, logging OTP locally:`, err);
        return { delivered: false, devOtp: otpCode };
      }
    } else {
      console.log(`[EmailService - DEV/LOCAL] 📩 OTP for ${toEmail}: ${otpCode}`);
      return { delivered: false, devOtp: otpCode };
    }
  }
}
