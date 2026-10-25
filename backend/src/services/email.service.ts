import { BrevoClient } from '@getbrevo/brevo';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailDeliveryError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.statusCode = statusCode;
  }
}

/**
 * Mask email address for safe audit logging without leaking PII (e.g., s***r@example.com)
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

/**
 * Clean and professional HTML email template generator for My Business
 */
const buildEmailHtml = ({
  headline,
  recipientName,
  introText,
  otpCode,
  purposeNotice,
  securityTip,
}: {
  headline: string;
  recipientName?: string;
  introText: string;
  otpCode: string;
  purposeNotice: string;
  securityTip: string;
}): string => {
  const currentYear = new Date().getFullYear();
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F6F0E8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #292426;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F6F0E8;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(73, 33, 43, 0.08);
      border: 1px solid rgba(220, 198, 155, 0.4);
    }
    .header {
      background-color: #49212B;
      padding: 32px 24px;
      text-align: center;
    }
    .brand-title {
      color: #DCC69B;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    .brand-subtitle {
      color: rgba(255, 255, 255, 0.75);
      font-size: 13px;
      margin-top: 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #292426;
      margin: 0 0 16px 0;
    }
    .intro {
      font-size: 15px;
      line-height: 1.6;
      color: #655B5D;
      margin: 0 0 28px 0;
    }
    .otp-wrapper {
      text-align: center;
      margin: 32px 0;
      padding: 24px 16px;
      background-color: #FBF8F4;
      border-radius: 12px;
      border: 1.5px dashed #DCC69B;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 10px;
      color: #49212B;
      margin: 0;
      display: inline-block;
    }
    .otp-expiry {
      margin-top: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #8C6A3E;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .security-box {
      background-color: #FFF9F0;
      border-left: 4px solid #DCC69B;
      padding: 14px 16px;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.5;
      color: #655B5D;
      margin: 24px 0 0 0;
    }
    .footer {
      background-color: #F6F0E8;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #8E8385;
      border-top: 1px solid rgba(220, 198, 155, 0.2);
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">MY BUSINESS</h1>
        <div class="brand-subtitle">Diamond Brokerage Ledger</div>
      </div>
      <div class="content">
        <p class="greeting">${greeting}</p>
        <p class="intro">${introText}</p>
        <div class="otp-wrapper">
          <div class="otp-code">${otpCode}</div>
          <div class="otp-expiry">&#9200; Valid for 5 minutes only</div>
        </div>
        <p class="intro" style="font-size: 14px; margin-bottom: 0;">${purposeNotice}</p>
        <div class="security-box">
          <strong>Security Notice:</strong> ${securityTip}
        </div>
      </div>
      <div class="footer">
        &copy; ${currentYear} My Business. Confidential diamond broker security verification.<br>
        Please do not reply directly to this automated email.
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Brevo Transactional Email Delivery Service
 */
export class BrevoEmailService {
  private client: BrevoClient | null = null;
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY?.trim() || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || '';
    this.senderName = process.env.BREVO_SENDER_NAME?.trim() || 'My Business';

    if (this.apiKey) {
      try {
        this.client = new BrevoClient({ apiKey: this.apiKey });
      } catch (err: unknown) {
        console.error('[BrevoEmailService] Failed to initialize BrevoClient');
      }
    }
  }

  /**
   * Check whether Brevo credentials are fully configured
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.senderEmail);
  }

  /**
   * Internal email dispatcher with safe error handling and zero secret/OTP logging
   */
  public async sendEmail(options: EmailOptions): Promise<EmailDeliveryResult> {
    const masked = maskEmail(options.to);

    if (!this.apiKey) {
      console.warn(`[BrevoEmailService] BREVO_API_KEY is not configured. Email to ${masked} was suppressed.`);
      throw new EmailDeliveryError('Email delivery service is currently not configured.', 503);
    }

    if (!this.senderEmail) {
      console.warn(`[BrevoEmailService] BREVO_SENDER_EMAIL is not configured. Email to ${masked} was suppressed.`);
      throw new EmailDeliveryError('Email sender identity is not configured.', 503);
    }

    try {
      const client = this.client || new BrevoClient({ apiKey: this.apiKey });

      const response = await client.transactionalEmails.sendTransacEmail({
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
        sender: {
          name: this.senderName,
          email: this.senderEmail,
        },
        to: [
          {
            email: options.to,
            name: options.toName || options.to,
          },
        ],
      });

      // Brevo returns messageId or messageIds
      const messageId = (response as any)?.messageId || (response as any)?.messageIds?.[0] || 'sent';

      return {
        success: true,
        messageId,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[BrevoEmailService] Failed to deliver email to ${masked}: ${errorMsg}`);
      throw new EmailDeliveryError(
        'Failed to deliver verification email. Please check the address or try again later.',
        502
      );
    }
  }

  /**
   * Sends registration verification OTP email
   */
  public async sendRegistrationOtp(email: string, name: string, otp: string): Promise<EmailDeliveryResult> {
    const subject = `Your My Business Verification Code: ${otp}`;
    const introText =
      'Thank you for joining My Business. To verify your email address and activate your diamond broker account, please enter the six-digit verification code below:';
    const purposeNotice =
      'This one-time password confirms your email identity and allows you to access your clients, consignments, and ledger bills securely.';
    const securityTip =
      'Never share this code with anyone. My Business representatives will never ask for your verification code.';

    const htmlContent = buildEmailHtml({
      headline: 'Email Verification',
      recipientName: name,
      introText,
      otpCode: otp,
      purposeNotice,
      securityTip,
    });

    const textContent = `Hello ${name || 'Broker'},

Your My Business registration verification code is: ${otp}

This code will expire in 5 minutes. Never share this code with anyone.
If you did not register for an account on My Business, please ignore this email.

--
My Business Diamond Brokerage`;

    return this.sendEmail({
      to: email,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  }

  /**
   * Sends password recovery OTP email
   */
  public async sendPasswordResetOtp(email: string, name: string, otp: string): Promise<EmailDeliveryResult> {
    const subject = `Reset Your My Business Password: ${otp}`;
    const introText =
      'We received a request to reset the password for your My Business diamond broker account. Please use the six-digit authorization code below:';
    const purposeNotice =
      'Enter this code on the password reset screen along with your new password to restore access to your account.';
    const securityTip =
      'If you did not request a password reset, your account is safe and you can disregard this email. Do not share this code.';

    const htmlContent = buildEmailHtml({
      headline: 'Password Recovery',
      recipientName: name,
      introText,
      otpCode: otp,
      purposeNotice,
      securityTip,
    });

    const textContent = `Hello ${name || 'Broker'},

We received a request to reset your My Business account password.
Your 6-digit authorization code is: ${otp}

This code will expire in 5 minutes.
If you did not initiate this request, please disregard this email.

--
My Business Diamond Brokerage`;

    return this.sendEmail({
      to: email,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });
  }
}

// Singleton email service instance
export const emailService = new BrevoEmailService();
