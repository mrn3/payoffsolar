# Facebook Webhook Troubleshooting Guide

This guide helps you troubleshoot Facebook Messenger webhook issues and ensure messages are being received properly.

## Quick Status Check

### 1. Test Webhook Locally
```bash
# Run the comprehensive webhook test
node scripts/test-facebook-webhook.js
```

This script will test:
- ✅ Environment variables
- ✅ Facebook API access
- ✅ Webhook verification
- ✅ Webhook message handling
- ⚠️ Webhook subscription (requires additional permissions)

### 2. Check Server Logs
When the server is running (`yarn dev`), you should see detailed logs for incoming webhooks:

```
🔔 Facebook webhook POST received
📝 Headers: { ... }
📦 Body length: 283
🔐 Signature verification:
   Received: sha256=...
   Expected: sha256=...
✅ Facebook webhook data received: { ... }
```

## Common Issues and Solutions

### Issue 1: Webhook Not Receiving Messages

**Symptoms:**
- No webhook logs in server console
- Messages sent to Facebook page don't appear in the system

**Solutions:**

1. **Check webhook URL in Facebook Developer Console:**
   - Go to Facebook Developer Console → Your App → Webhooks
   - Verify webhook URL is correct: `https://yourdomain.com/api/facebook/webhook`
   - For local testing, use ngrok: `https://abc123.ngrok.io/api/facebook/webhook`

2. **Verify webhook subscription:**
   - In Facebook Developer Console, ensure your page is subscribed to the webhook
   - Required webhook fields: `messages`, `messaging_postbacks`

3. **Check environment variables:**
   ```bash
   # Verify these are set in .env.local
   FACEBOOK_VERIFY_TOKEN=payoffsolar
   FACEBOOK_APP_SECRET=your_app_secret
   FACEBOOK_PAGE_ACCESS_TOKEN=your_page_token
   ```

### Issue 2: Webhook Verification Fails

**Symptoms:**
- Error in Facebook Developer Console when setting up webhook
- "Invalid verify token" or similar errors

**Solutions:**

1. **Test verification locally:**
   ```bash
   curl "http://localhost:3000/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=payoffsolar&hub.challenge=test123"
   # Should return: test123
   ```

2. **Check verify token:**
   - Ensure `FACEBOOK_VERIFY_TOKEN` in `.env.local` matches what you enter in Facebook Developer Console
   - Default value: `payoffsolar`

### Issue 3: Signature Verification Fails

**Symptoms:**
- Server logs show "Invalid Facebook webhook signature"
- Webhook receives data but rejects it

**Solutions:**

1. **Verify app secret:**
   - Check `FACEBOOK_APP_SECRET` in `.env.local`
   - Get correct value from Facebook Developer Console → App Settings → Basic

2. **Check request headers:**
   - Ensure Facebook is sending `X-Hub-Signature-256` header
   - Verify header format: `sha256=...`

### Issue 4: Database Errors

**Symptoms:**
- "Incorrect datetime value" errors
- Messages received but not stored

**Solutions:**

1. **Check database connection:**
   ```bash
   node scripts/test-database-connection.js
   ```

2. **Verify table structure:**
   ```bash
   node scripts/check-communication-tables.js
   ```

3. **Run migration if needed:**
   ```bash
   node scripts/run-facebook-migration-production.js
   ```

### Issue 5: User Profile Fetch Fails

**Symptoms:**
- "Failed to fetch Facebook user profile: 400" in logs
- Messages processed but contact creation fails

**Solutions:**

1. **Check page access token permissions:**
   - Token needs `pages_messaging` permission
   - Token needs `pages_show_list` permission

2. **Verify token validity:**
   ```bash
   curl "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"
   ```

## Local Development Setup

### Using ngrok for Local Testing

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your local server:**
   ```bash
   yarn dev
   ```

3. **Expose local server:**
   ```bash
   ngrok http 3000
   ```

4. **Update Facebook webhook URL:**
   - Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
   - In Facebook Developer Console, set webhook URL to: `https://abc123.ngrok.io/api/facebook/webhook`

5. **Test webhook:**
   - Send a message to your Facebook page
   - Check server logs for webhook activity

## Production Deployment

### Webhook URL Requirements

- Must be HTTPS (not HTTP)
- Must be publicly accessible
- Must respond to GET requests for verification
- Must respond to POST requests for messages

### Environment Variables

Ensure these are set in your production environment:

```bash
FACEBOOK_VERIFY_TOKEN=payoffsolar
FACEBOOK_APP_SECRET=your_production_app_secret
FACEBOOK_PAGE_ACCESS_TOKEN=your_production_page_token
```

### Facebook Developer Console Setup

1. **App Settings:**
   - Set app domain to your production domain
   - Add your production URL to valid OAuth redirect URIs

2. **Webhooks:**
   - Set webhook URL to: `https://yourdomain.com/api/facebook/webhook`
   - Subscribe to: `messages`, `messaging_postbacks`
   - Verify token: `payoffsolar`

3. **Page Subscription:**
   - Subscribe your Facebook page to the webhook
   - Test by sending a message to the page

## Import Historical Messages

### Using the Admin Interface

1. Go to Dashboard → Facebook Conversations
2. Click "Import Historical Messages" button
3. Wait for import to complete (may take several minutes)

### Using the Command Line

```bash
node scripts/import-facebook-messages.js
```

### Using the API

```bash
curl -X POST http://localhost:3000/api/facebook/import-messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Monitoring and Logs

### Server Logs to Watch

- `🔔 Facebook webhook POST received` - Webhook is being called
- `✅ Facebook webhook data received` - Data parsed successfully
- `Message stored successfully` - Message saved to database
- `❌ Invalid Facebook webhook signature` - Signature verification failed

### Database Queries

Check recent Facebook messages:
```sql
SELECT * FROM facebook_messages ORDER BY created_at DESC LIMIT 10;
```

Check conversations:
```sql
SELECT fc.*, c.name as contact_name 
FROM facebook_conversations fc 
LEFT JOIN contacts c ON fc.contact_id = c.id 
ORDER BY fc.last_message_time DESC;
```

## Support

If you continue to have issues:

1. Run the test script: `node scripts/test-facebook-webhook.js`
2. Check server logs for detailed error messages
3. Verify Facebook Developer Console configuration
4. Test with ngrok for local development
5. Check database connectivity and table structure
