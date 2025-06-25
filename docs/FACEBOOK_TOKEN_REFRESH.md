# Facebook Marketplace Token Refresh Guide

## Problem
Facebook access tokens expire periodically, causing "Session has expired" errors when trying to create listings.

## Solution: Get a New Access Token

### Method 1: Facebook Graph API Explorer (Recommended)

1. **Go to Graph API Explorer**
   - Visit: https://developers.facebook.com/tools/explorer/, or directly to https://developers.facebook.com/tools/explorer/683059651390078/

2. **Select Your App**
   - In the "Facebook App" dropdown, select your Payoff Solar app
   - If you don't see it, make sure you're logged in with the correct Facebook account

3. **Generate Access Token**
   - Click "Generate Access Token"
   - You'll be prompted to log in and authorize permissions

4. **Add Required Permissions**
   - Click "Add a Permission" and add these permissions:
     - `catalog_management`
     - `pages_show_list` 
     - `business_management`
     - `pages_read_engagement`

5. **Get Long-lived Token**
   - Click "Generate Access Token" again
   - Copy the generated token (it will be quite long)

### Method 2: Facebook Business Manager

1. **Go to Facebook Business Manager**
   - Visit: https://business.facebook.com/

2. **Navigate to Business Settings**
   - Click the gear icon in the top right
   - Go to "Business Settings"

3. **System Users**
   - In the left sidebar, click "System Users"
   - Find your system user or create a new one
   - Click "Generate New Token"

4. **Select Permissions**
   - Choose your app
   - Select the required permissions:
     - `catalog_management`
     - `pages_show_list`
     - `business_management`

5. **Copy Token**
   - Copy the generated access token

## Update Token in Payoff Solar

1. **Go to Platform Settings**
   - Navigate to Dashboard → Settings → Platform Settings

2. **Edit Facebook Marketplace**
   - Find Facebook Marketplace in the list
   - Click the edit button (pencil icon)

3. **Update Access Token**
   - Paste the new access token in the "Access Token" field
   - Make sure Page ID and Product Catalog ID are still correct
   - Click "Save"

4. **Test the Connection**
   - Try creating a listing to verify the token works

## Token Lifespan

- **Short-lived tokens**: Expire in 1-2 hours
- **Long-lived tokens**: Expire in 60 days
- **System user tokens**: Can be set to never expire (recommended for automation)

## Troubleshooting

### Common Error Codes
- **190**: Invalid access token
- **102**: Session key invalid
- **463**: The session has been invalidated

### If You Still Get Errors
1. Verify your Facebook app is in "Live" mode (not Development)
2. Check that your Business Manager account has access to the Product Catalog
3. Ensure your Facebook page is connected to your Business Manager
4. Verify the Product Catalog ID is correct

### Getting Product Catalog ID
1. Go to Facebook Business Manager
2. Navigate to "Catalog Manager"
3. Select your product catalog
4. The ID will be in the URL: `facebook.com/products/catalogs/[CATALOG_ID]/`

## Prevention

To avoid frequent token expiration:
1. Use System User tokens instead of personal access tokens
2. Set up proper app review to get long-term permissions
3. Consider implementing automatic token refresh (advanced)

## Need Help?

If you continue having issues:
1. Check the Facebook Developer Console for any app-level issues
2. Verify your app has the necessary permissions approved
3. Contact Facebook Developer Support if needed
