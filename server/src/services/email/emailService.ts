import nodemailer, { type Transporter } from 'nodemailer';

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || 'celeste.araceli03@gmail.com';
    const pass = process.env.SMTP_PASS || 'ycktowueyyczeluh';

    if (user && pass) {
      if (host.includes('gmail') || user.endsWith('@gmail.com')) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 10000,
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 10000,
        });
      }
      return this.transporter;
    }

    return null;
  }

  public static async sendOtpEmail(toEmail: string, otpCode: string, purpose: 'login' | 'register' | 'forgot-password' = 'login'): Promise<{ delivered: boolean; error?: string }> {
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

    // 1. Primary Cloud Delivery: Brevo HTTPS API (Works on Render/Vercel/Railway without SMTP firewall blocks; 300 free emails/day to ANY email address)
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'celeste.araceli03@gmail.com';
        const senderName = process.env.BREVO_SENDER_NAME || 'IntellMeet Security';
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: toEmail }],
            subject: `${otpCode} is your IntellMeet verification code`,
            htmlContent: htmlContent,
          }),
        });

        if (response.ok) {
          console.log(`[EmailService] OTP email sent via Brevo HTTPS API to ${toEmail}`);
          return { delivered: true };
        } else {
          const errData: any = await response.json();
          console.warn(`[EmailService] Brevo API returned error:`, errData);
          if (errData?.message?.includes('unrecognised IP address') || errData?.code === 'unauthorized') {
            console.warn('[EmailService] Note: If Brevo rejects IP, disable Authorized IPs at https://app.brevo.com/security/authorised_ips');
          }
        }
      } catch (err: any) {
        console.warn(`[EmailService] Brevo API request failed:`, err?.message || err);
      }
    }

    // 2. Secondary Free Delivery: Gmail / Standard SMTP (Sends to ANY email address free, up to 500 emails/day)
    const transporter = this.getTransporter();
    const defaultUser = process.env.SMTP_USER || 'celeste.araceli03@gmail.com';
    const fromAddress = process.env.SMTP_FROM || `"IntellMeet Security" <${defaultUser}>`;

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: `${otpCode} is your IntellMeet verification code`,
          html: htmlContent,
          text: `Your IntellMeet ${actionLabel} OTP code is: ${otpCode}. Valid for 5 minutes.`,
        });
        console.log(`[EmailService] OTP email successfully sent via SMTP to ${toEmail} (MessageId: ${info.messageId})`);
        return { delivered: true };
      } catch (err: any) {
        console.warn(`[EmailService] SMTP delivery failed to ${toEmail}:`, err?.message || err);
      }
    }

    // 3. Local Development Fallback: Log OTP to console so testing is never blocked
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n======================================================`);
      console.log(`🔑 [DEV OTP FALLBACK] To: ${toEmail} | Code: ${otpCode}`);
      console.log(`======================================================\n`);
      return { delivered: true };
    }

    return {
      delivered: false,
      error: 'Unable to deliver verification email. Please check your Brevo or SMTP configuration.',
    };
  }
}
