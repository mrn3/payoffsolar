# SendGrid Email Setup

This guide will help you configure SendGrid for email functionality in your Payoff Solar application.

## Prerequisites

1. A SendGrid account (free tier available)
2. A verified sender email address or domain

## Setup Steps

### 1. Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/) and create a free account
2. Complete the account verification process

### 2. Create API Key

1. Log into your SendGrid dashboard
2. Go to **Settings** > **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access** and give it a name like "Payoff Solar"
5. Under **Mail Send**, select **Full Access**
6. Click **Create & View**
7. Copy the API key (you won't be able to see it again)

### 3. Set Up Sender Authentication

#### Option A: Single Sender Verification (Easiest)
1. Go to **Settings** > **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - **From Name**: Payoff Solar
   - **From Email**: noreply@yourdomain.com (use your actual domain)
   - **Reply To**: support@yourdomain.com (optional)
   - **Company Address**: Your business address
4. Click **Create**
5. Check your email and click the verification link

#### Option B: Domain Authentication (Recommended for Production)
1. Go to **Settings** > **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain (e.g., yourdomain.com)
4. Follow the DNS setup instructions provided by SendGrid
5. Wait for DNS propagation and verification

### 4. Update Environment Variables

Update your `.env.local` file with your SendGrid credentials:

```env
# SendGrid Email Configuration
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Payoff Solar
```

**Important**: 
- Replace `SG.your-actual-api-key-here` with your actual SendGrid API key
- Replace `noreply@yourdomain.com` with your verified sender email
- Make sure the email address matches what you verified in SendGrid

### 5. Test Email Functionality

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to the forgot password page: `http://localhost:6660/forgot-password`

3. Enter a valid email address that exists in your database

4. Check your email for the password reset message

## Troubleshooting

### Common Issues

1. **"Forbidden" Error**
   - Make sure your API key has Mail Send permissions
   - Verify the API key is correctly set in your environment variables

2. **"The from address does not match a verified Sender Identity"**
   - Ensure your `SENDGRID_FROM_EMAIL` matches exactly what you verified in SendGrid
   - Check that sender verification is complete

3. **Emails Not Received**
   - Check your spam/junk folder
   - Verify the recipient email exists in your database
   - Check the server logs for any error messages

4. **Development Mode**
   - If `SENDGRID_API_KEY` is not set, the system will log email details to the console instead of sending actual emails
   - This is useful for development and testing

### Checking Logs

Monitor your application logs to see email sending status:
- ✅ Success: "Email sent successfully to: user@example.com"
- ❌ Error: "Failed to send email:" followed by error details
- 📧 Development: Email details logged to console when API key is missing

## Production Considerations

1. **Domain Authentication**: Use domain authentication instead of single sender verification
2. **Environment Variables**: Ensure all SendGrid variables are properly set in your production environment
3. **Rate Limits**: Be aware of SendGrid's sending limits on your plan
4. **Monitoring**: Set up SendGrid webhooks to track email delivery status
5. **Templates**: Consider using SendGrid's dynamic templates for more complex emails

## SendGrid Plans

- **Free**: 100 emails/day forever
- **Essentials**: Starting at $14.95/month for 50,000 emails
- **Pro**: Starting at $89.95/month for 100,000 emails

For most small to medium applications, the free tier is sufficient to get started.

## Support

If you encounter issues:
1. Check SendGrid's [documentation](https://docs.sendgrid.com/)
2. Review your SendGrid dashboard for delivery statistics
3. Check the application logs for detailed error messages
