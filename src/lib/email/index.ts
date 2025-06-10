import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@payoffsolar.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Payoff Solar';

if (!SENDGRID_API_KEY) {
  console.warn('⚠️  SENDGRID_API_KEY not found in environment variables. Email functionality will be disabled.');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log('📧 Email would be sent to:', options.to);
    console.log('📧 Subject:', options.subject);
    console.log('📧 Content:', options.text || 'HTML content provided');
    return true;
  }

  try {
    const msg = {
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    };

    await sgMail.send(msg);
    console.log('✅ Email sent successfully to:', options.to);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';
  const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;

  const html = generatePasswordResetEmailHtml(resetUrl);
  const text = generatePasswordResetEmailText(resetUrl);

  return sendEmail({
    to: email,
    subject: 'Reset Your Payoff Solar Password',
    html,
    text,
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000';
  const loginUrl = `${siteUrl}/login`;

  const html = generateWelcomeEmailHtml(firstName, loginUrl);
  const text = generateWelcomeEmailText(firstName, loginUrl);

  return sendEmail({
    to: email,
    subject: 'Welcome to Payoff Solar!',
    html,
    text,
  });
}

/**
 * Generate HTML content for password reset email
 */
function generatePasswordResetEmailHtml(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .sun-icon {
          width: 32px;
          height: 32px;
          background-color: #10b981;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }
        h1 {
          color: #1f2937;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .subtitle {
          color: #6b7280;
          margin: 0 0 30px 0;
        }
        .button {
          display: inline-block;
          background-color: #10b981;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #059669;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="sun-icon">☀</div>
            Payoff Solar
          </div>
          <h1>Reset Your Password</h1>
          <p class="subtitle">We received a request to reset your password for your Payoff Solar account.</p>
        </div>
        
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
        
        <div class="warning">
          <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email.
        </div>
        
        <div class="footer">
          <p>If you have any questions, please contact our support team.</p>
          <p>© ${new Date().getFullYear()} Payoff Solar. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text content for password reset email
 */
function generatePasswordResetEmailText(resetUrl: string): string {
  return `
Reset Your Payoff Solar Password

We received a request to reset your password for your Payoff Solar account.

To reset your password, click the following link:
${resetUrl}

This link will expire in 1 hour for your security.

If you didn't request this password reset, you can safely ignore this email.

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Payoff Solar. All rights reserved.
  `.trim();
}

/**
 * Generate HTML content for welcome email
 */
function generateWelcomeEmailHtml(firstName: string, loginUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Payoff Solar</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .sun-icon {
          width: 32px;
          height: 32px;
          background-color: #10b981;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }
        h1 {
          color: #1f2937;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .button {
          display: inline-block;
          background-color: #10b981;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="sun-icon">☀</div>
            Payoff Solar
          </div>
          <h1>Welcome to Payoff Solar, ${firstName}!</h1>
        </div>

        <p>Thank you for joining Payoff Solar! We're excited to help you on your solar energy journey.</p>

        <p>Your account has been successfully created. You can now:</p>
        <ul>
          <li>Browse our solar products and solutions</li>
          <li>Get personalized quotes for your home</li>
          <li>Track your orders and installations</li>
          <li>Access exclusive customer resources</li>
        </ul>

        <div style="text-align: center;">
          <a href="${loginUrl}" class="button">Login to Your Account</a>
        </div>

        <p>If you have any questions, our support team is here to help. We look forward to helping you harness the power of the sun!</p>

        <div class="footer">
          <p>Thank you for choosing Payoff Solar!</p>
          <p>© ${new Date().getFullYear()} Payoff Solar. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text content for welcome email
 */
function generateWelcomeEmailText(firstName: string, loginUrl: string): string {
  return `
Welcome to Payoff Solar, ${firstName}!

Thank you for joining Payoff Solar! We're excited to help you on your solar energy journey.

Your account has been successfully created. You can now:
- Browse our solar products and solutions
- Get personalized quotes for your home
- Track your orders and installations
- Access exclusive customer resources

Login to your account: ${loginUrl}

If you have any questions, our support team is here to help. We look forward to helping you harness the power of the sun!

Thank you for choosing Payoff Solar!

© ${new Date().getFullYear()} Payoff Solar. All rights reserved.
  `.trim();
}

/**
 * Simple HTML to text converter
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
