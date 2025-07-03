# Facebook Messenger Integration Setup

This guide will help you set up Facebook Messenger integration for your Payoff Solar application to automatically capture conversations from Facebook Marketplace and manage them in your CRM.

## Overview

The Facebook Messenger integration allows you to:
- Automatically create contacts from Facebook Marketplace conversations
- Store all message history in your database
- Reply to customers directly from your admin dashboard
- Maintain unified customer communication records

## Prerequisites

1. A Facebook Page for your business
2. A Facebook App with Messenger permissions
3. Your Payoff Solar application running with admin access
4. SSL certificate (required for webhooks)

## Setup Steps

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **Create App** and choose **Business** type
3. Fill in your app details:
   - **App Name**: "Payoff Solar Messenger"
   - **Contact Email**: Your business email
   - **Business Account**: Select your business account

### 2. Configure Messenger Platform

1. In your Facebook App dashboard, click **Add Product**
2. Find **Messenger** and click **Set Up**
3. In the Messenger settings:
   - **Access Tokens**: Generate a Page Access Token for your business page
   - **Webhooks**: We'll configure this in step 4

### 3. Set Up Webhooks

1. In Messenger settings, find **Webhooks** section
2. Click **Add Callback URL**
3. Enter your webhook URL: `https://yourdomain.com/api/facebook/webhook`
4. Enter a **Verify Token** (create a random string, you'll need this for environment variables)
5. Select these **Webhook Fields**:
   - `messages`
   - `messaging_postbacks`
   - `message_deliveries`
   - `message_reads`

### 4. Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Facebook Messenger Configuration
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_VERIFY_TOKEN=your_verify_token_here
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
```

**Where to find these values:**
- **App Secret**: Facebook App > Settings > Basic > App Secret
- **Verify Token**: The random string you created in step 3
- **Page Access Token**: Facebook App > Messenger > Access Tokens

### 5. Subscribe Your Page

1. In Messenger settings, find **Webhooks** section
2. In the **Select a page to subscribe your webhook** dropdown
3. Choose your business page
4. Click **Subscribe**

### 6. Test the Integration

1. Send a message to your Facebook Page from a personal account
2. Check your application logs for webhook events
3. Verify the conversation appears in your admin dashboard at `/dashboard/facebook-conversations`

## Security Considerations

1. **Webhook Verification**: The integration verifies all incoming webhooks using your App Secret
2. **HTTPS Required**: Facebook requires HTTPS for webhook URLs
3. **Access Token Security**: Keep your Page Access Token secure and rotate it regularly

## Troubleshooting

### Webhook Verification Failed
- Check that `FACEBOOK_VERIFY_TOKEN` matches what you entered in Facebook
- Ensure your webhook URL is accessible and returns the challenge

### Messages Not Appearing
- Verify your Page Access Token is correct and hasn't expired
- Check that your page is subscribed to the webhook
- Review application logs for error messages

### Cannot Send Messages
- Ensure `FACEBOOK_PAGE_ACCESS_TOKEN` has the correct permissions
- Check that the conversation was initiated by the customer (Facebook policy)
- Verify your app has been approved for messaging (if required)

## Facebook App Review (If Needed)

For production use with pages you don't own, you may need Facebook App Review:

1. **Required Permissions**:
   - `pages_messaging`
   - `pages_show_list`

2. **Submission Requirements**:
   - Detailed use case description
   - Privacy policy URL
   - Terms of service URL
   - App icon and screenshots

## API Endpoints

The integration provides these API endpoints:

- `GET /api/facebook/conversations` - List all conversations
- `GET /api/facebook/conversations/[id]/messages` - Get messages for a conversation
- `POST /api/facebook/send-message` - Send a message to a customer
- `POST /api/facebook/webhook` - Webhook endpoint for Facebook

## Database Schema

The integration creates these tables:

- `facebook_conversations` - Stores conversation metadata
- `facebook_messages` - Stores individual messages
- Adds `facebook_user_id` column to existing `contacts` table

## Features

### Automatic Contact Creation
- Creates new contacts when customers message for the first time
- Links Facebook user ID to contact records
- Fetches user profile information from Facebook

### Message Storage
- Stores all incoming and outgoing messages
- Preserves message timestamps and metadata
- Handles different message types (text, images, files)

### Admin Interface
- View all conversations in one place
- See message history for each customer
- Reply directly from the dashboard
- Links to existing contact records

## Limitations

1. **24-Hour Window**: You can only send messages within 24 hours of the customer's last message (Facebook policy)
2. **Customer Initiated**: Conversations must be initiated by the customer
3. **Page Messages Only**: Only works with messages sent to your Facebook Page
4. **Rate Limits**: Facebook has rate limits on API calls

## Support

If you encounter issues:
1. Check the application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test webhook connectivity using Facebook's webhook testing tool
4. Review Facebook's Messenger Platform documentation

## Next Steps

After setup is complete:
1. Train your team on using the Facebook Messages interface
2. Set up notification systems for new messages
3. Consider integrating with your existing customer service workflows
4. Monitor message volume and response times
