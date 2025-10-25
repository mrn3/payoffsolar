# AWS SES Email Setup

This guide explains how to configure AWS Simple Email Service (SES) for the Payoff Solar application.

## Prerequisites
- An AWS account
- Access to create/verify SES identities (email or domain)
- For production sending: request production access (to exit the SES sandbox)

## Steps

### 1) Choose Region
Pick an SES-supported region (e.g., us-west-2 or us-east-1). You will set this as `AWS_REGION`.

### 2) Verify a Sender (Email or Domain)
- In the AWS console, open SES > Verified identities
- Click "Create identity" and verify either:
  - Email address (quick for testing), or
  - Domain (recommended for production)
- If verifying a domain, add the provided DNS records (SPF/DKIM) at your DNS provider

### 3) Request Production Access (recommended)
New SES accounts are in "sandbox" and can only send to/ from verified emails. In SES > Account dashboard, request production access so you can email unverified recipients.

### 4) IAM Credentials (if not using instance role)
If your server doesn't use an instance role or other AWS auth mechanism, create an IAM user with permission to send email via SES.
- Attach policy: `AmazonSESFullAccess` (or a least-privilege equivalent allowing `ses:SendEmail`)
- Record the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### 5) Configure Environment Variables
The app uses the AWS SDK for SES. Set these in `.env` (production server) and `.env.local` (development):

```env
# Required
AWS_REGION=us-west-2
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=Payoff Solar

# Optional (only if not using instance role or other default AWS auth)
# AWS_ACCESS_KEY_ID=your-aws-access-key-id
# AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

On production servers, environment variables are loaded from `.env` (not `.env.local`).

### 6) Install Dependencies
We replaced SendGrid with the AWS SES SDK for Node.js. Run these commands:

```bash
yarn remove @sendgrid/mail
yarn add @aws-sdk/client-ses
```

### 7) Test Email
- Use the UI (e.g., Contacts > Send Email) or the forgot password flow to trigger an email
- In development without credentials/region, the app logs the would-be email to the console

### Notes
- Ensure `SES_FROM_EMAIL` matches a verified identity in the chosen region
- For best deliverability, verify your sending domain and enable DKIM (via SES DNS records)
- Keep `JWT_SECRET` and other secrets secure

