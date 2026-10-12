import nodemailer from 'nodemailer';

interface SendVerificationEmailOptions {
  to: string;
  name: string;
  code: string;
  expiresInMinutes?: number;
}

interface SendPasswordResetOptions {
  to: string;
  name: string;
  code: string;
  expiresInMinutes?: number;
}

class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      });
      this.isConfigured = true;
      console.log('📧 Nodemailer: Production SMTP transport initialized.');
    } else {
      // In development / local testing: use nodemailer JSON transport or console dispatch
      this.transporter = nodemailer.createTransport({
        jsonTransport: true
      });
      this.isConfigured = true;
      console.log('📧 Nodemailer: Local development mailbox ready (codes logged in terminal).');
    }
  }

  /**
   * Send 6-Digit Email Verification Code
   */
  async sendVerificationCode({ to, name, code, expiresInMinutes = 15 }: SendVerificationEmailOptions) {
    const fromAddress = process.env.EMAIL_FROM || 'Veyra Academy <verify@veyra.org>';
    const subject = `Veyra Email Verification Code: ${code} (वेयरा सत्यापन कोड)`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 30px 10px; }
        .card { max-width: 520px; margin: 0 auto; background-color: #1E293B; border-radius: 20px; border: 1px solid #334155; padding: 36px 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .logo { font-size: 24px; font-weight: 800; color: #6366F1; letter-spacing: -0.5px; margin-bottom: 4px; }
        .tagline { font-size: 11px; color: #94A3B8; text-transform: uppercase; font-family: monospace; letter-spacing: 1px; margin-bottom: 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #CBD5E1; margin-bottom: 24px; }
        .code-container { background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15)); border: 2px dashed #6366F1; border-radius: 16px; padding: 22px; text-align: center; margin: 26px 0; }
        .code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #A5B4FC; display: inline-block; }
        .expire { font-size: 12px; color: #F59E0B; margin-top: 10px; font-weight: 600; }
        .footer { font-size: 11px; color: #64748B; margin-top: 30px; border-top: 1px solid #334155; padding-top: 16px; line-height: 1.5; }
        .devanagari { font-family: 'Noto Sans Devanagari', sans-serif; color: #CBD5E1; margin-top: 8px; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">Veyra (वेयरा)</div>
        <div class="tagline">“See beyond what you know.”</div>
        
        <div class="greeting">Hello ${name},</div>
        <div class="text">
          Thank you for registering on <strong>Veyra</strong>. To verify your email address and activate your learning portal access, please use the 6-digit verification code below:
          <div class="devanagari">वेयरा में आपका स्वागत है। अपने ईमेल सत्यापन और खाते को सक्रिय करने के लिए नीचे दिए गए 6-अंकीय कोड का उपयोग करें:</div>
        </div>

        <div class="code-container">
          <div class="code">${code}</div>
          <div class="expire">⏱️ Valid for ${expiresInMinutes} minutes (15 मिनट के लिए मान्य)</div>
        </div>

        <div class="text" style="font-size: 12px; color: #94A3B8;">
          If you did not initiate this request, you can safely disregard this email. Your account remains protected.
        </div>

        <div class="footer">
          Veyra Platform Security Operations • DPDP Act 2023 Compliant • Automated Message, Please Do Not Reply.
        </div>
      </div>
    </body>
    </html>
    `;

    console.log(`\n======================================================`);
    console.log(`📩 [VERIFICATION EMAIL DISPATCH]`);
    console.log(`To: ${to} (${name})`);
    console.log(`6-DIGIT OTP CODE: [ ${code} ]`);
    console.log(`Expires in: ${expiresInMinutes} minutes`);
    console.log(`======================================================\n`);

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html: htmlContent
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
        }

        return { success: true, messageId: info.messageId, previewUrl, code };
      } catch (err: any) {
        console.error('❌ Failed to send verification email via transporter:', err.message);
        return { success: false, error: err.message, code };
      }
    }

    return { success: true, code, simulated: true };
  }

  /**
   * Send Password Reset Code
   */
  async sendPasswordResetCode({ to, name, code, expiresInMinutes = 15 }: SendPasswordResetOptions) {
    const fromAddress = process.env.EMAIL_FROM || 'Veyra Security <security@veyra.org>';
    const subject = `Veyra Password Reset Code: ${code} (वेयरा पासवर्ड रीसेट कोड)`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A; color: #F8FAFC; padding: 30px 10px; }
        .card { max-width: 520px; margin: 0 auto; background-color: #1E293B; border-radius: 20px; border: 1px solid #334155; padding: 36px 30px; }
        .logo { font-size: 24px; font-weight: 800; color: #6366F1; margin-bottom: 4px; }
        .greeting { font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
        .code-container { background: rgba(239, 68, 68, 0.1); border: 2px dashed #EF4444; border-radius: 16px; padding: 22px; text-align: center; margin: 26px 0; }
        .code { font-family: monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #FCA5A5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">Veyra Security (वेयरा)</div>
        <div class="greeting">Password Reset Request</div>
        <p style="color: #CBD5E1; font-size: 14px;">
          Hello ${name}, a request was received to reset your Veyra account password. Enter this code to proceed:
        </p>
        <div class="code-container">
          <div class="code">${code}</div>
          <div style="font-size: 12px; color: #F87171; margin-top: 8px;">Valid for ${expiresInMinutes} minutes</div>
        </div>
      </div>
    </body>
    </html>
    `;

    console.log(`\n======================================================`);
    console.log(`🔐 [PASSWORD RESET EMAIL DISPATCH]`);
    console.log(`To: ${to} (${name})`);
    console.log(`RESET OTP CODE: [ ${code} ]`);
    console.log(`======================================================\n`);

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html: htmlContent
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        return { success: true, messageId: info.messageId, previewUrl, code };
      } catch (err: any) {
        return { success: false, error: err.message, code };
      }
    }

    return { success: true, code, simulated: true };
  }
}

export const mailService = new MailService();
