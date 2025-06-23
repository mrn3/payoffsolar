# Platform Setup Guide

This guide provides detailed instructions for setting up credentials for each marketplace platform supported by Payoff Solar.

## eBay

### Requirements
- eBay Developer Account
- eBay Seller Account

### Setup Steps
1. **Create eBay Developer Account**
   - Go to [eBay Developers](https://developer.ebay.com/)
   - Sign up for a developer account
   - Verify your email address

2. **Create Application**
   - Visit [My Keys](https://developer.ebay.com/my/keys)
   - Click "Create an Application"
   - Fill in application details
   - Choose "Production" for live listings or "Sandbox" for testing

3. **Get Credentials**
   - **App ID (Client ID)**: Found in your application dashboard
   - **Dev ID**: Your developer account ID
   - **Cert ID (Client Secret)**: Found in your application dashboard
   - **User Token**: Generate using eBay's "Get a User Token" tool

4. **Additional Setup**
   - For production use, submit your app for eBay review
   - Set up return policy and shipping details in eBay Seller Hub

### Documentation
- [eBay API Documentation](https://developer.ebay.com/api-docs/static/gs_create-the-ebay-api-keysets.html)
- [Trading API Guide](https://developer.ebay.com/devzone/xml/docs/reference/ebay/index.html)

---

## Facebook Marketplace

### Requirements
- Facebook Business Account
- Facebook Business Page
- Facebook Developer Account

### Setup Steps
1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/apps/)
   - Click "Create App"
   - Choose "Business" as app type
   - Fill in app details

2. **Add Marketing API**
   - In your app dashboard, click "Add Product"
   - Select "Marketing API"
   - Complete the setup process

3. **Create Business Page**
   - If you don't have one, create a Facebook Business Page
   - Note down your Page ID (found in Page Settings)

4. **Generate Access Token**
   - Use Facebook's Graph API Explorer
   - Request permissions: `pages_manage_posts`, `pages_show_list`
   - Generate a long-lived access token

### Required Credentials
- **Access Token**: Long-lived page access token
- **Page ID**: Your Facebook Business Page ID

### Documentation
- [Facebook Marketing API](https://developers.facebook.com/docs/marketing-api/catalog)
- [Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)

---

## Amazon

### Requirements
- Amazon Seller Central Account
- AWS Account (for API access)
- Amazon Developer Account

### Setup Steps
1. **Register as Amazon Seller**
   - Go to [Amazon Seller Central](https://sellercentral.amazon.com/)
   - Complete seller registration
   - Verify your identity and bank account

2. **Create Developer Profile**
   - Visit [Developer Console](https://sellercentral.amazon.com/apps/manage)
   - Go to "Apps & Services" > "Develop apps for Amazon"
   - Create a new developer profile

3. **Register Application**
   - Create a new application in Developer Console
   - Note down your application details

4. **Get AWS Credentials**
   - Create AWS IAM user with appropriate permissions
   - Generate Access Key ID and Secret Access Key

5. **Find Required IDs**
   - **Seller ID**: Found in Seller Central settings
   - **Marketplace ID**: Use `A1VC38T7YXB528` for US marketplace

### Required Credentials
- **Access Key ID**: AWS IAM access key
- **Secret Access Key**: AWS IAM secret key
- **Seller ID**: Your Amazon seller identifier
- **Marketplace ID**: Target marketplace (US: A1VC38T7YXB528)
- **Region**: AWS region (usually us-east-1)

### Documentation
- [Amazon SP-API Documentation](https://developer-docs.amazon.com/sp-api/docs/registering-your-application)
- [Marketplace IDs](https://developer-docs.amazon.com/sp-api/docs/marketplace-ids)

---

## KSL Classifieds

### Requirements
- KSL Account
- Phone number for verification

### Setup Steps
1. **Create KSL Account**
   - Go to [KSL.com](https://www.ksl.com/)
   - Click "Sign Up" and create an account
   - Verify your phone number

2. **Account Verification**
   - Complete phone verification process
   - Ensure account is in good standing

### Required Credentials
- **Username**: Your KSL username or email
- **Password**: Your KSL password

### Important Notes
- KSL doesn't have an official API
- This integration uses web automation
- Ensure your account remains active and verified

### Documentation
- [KSL Help Center](https://www.ksl.com/help)

---

## OfferUp

### Requirements
- OfferUp Account
- Phone number for verification

### Setup Steps
1. **Create OfferUp Account**
   - Go to [OfferUp.com](https://offerup.com/)
   - Sign up for an account
   - Verify your phone number

2. **Complete Profile**
   - Add profile photo and information
   - Verify your identity if required

### Required Credentials
- **Username**: Your OfferUp username or email
- **Password**: Your OfferUp password

### Important Notes
- OfferUp doesn't have a public API
- This integration uses web automation
- Keep your account in good standing

### Documentation
- [OfferUp Support](https://offerup.com/support/)

---

## Nextdoor

### Requirements
- Nextdoor Account
- Verified address in your neighborhood

### Setup Steps
1. **Create Nextdoor Account**
   - Go to [Nextdoor.com](https://nextdoor.com/)
   - Sign up with your address
   - Verify your address (may require postcard verification)

2. **Join Your Neighborhood**
   - Complete the neighborhood verification process
   - Ensure your account is active

### Required Credentials
- **Email**: Your Nextdoor email address
- **Password**: Your Nextdoor password

### Important Notes
- Nextdoor doesn't have a public API
- This integration uses web automation
- You can only post in your verified neighborhood

### Documentation
- [Nextdoor Help Center](https://help.nextdoor.com/)

---

## Craigslist

### Requirements
- Email address
- Phone number for verification (varies by city)

### Setup Steps
1. **Create Account**
   - Go to your local Craigslist site
   - Account creation process varies by city
   - Some cities require phone verification

2. **Verify Account**
   - Complete any required verification steps
   - Ensure you can post in your desired categories

### Required Credentials
- **Email**: Your Craigslist email address
- **Password**: Your Craigslist password

### Important Notes
- Craigslist doesn't have an official API
- This integration uses web automation
- Posting rules and requirements vary by city
- Some categories may require additional fees

### Documentation
- [Craigslist Help](https://www.craigslist.org/about/help/)

---

## General Security Notes

1. **Keep Credentials Secure**
   - Never share your API keys or passwords
   - Use strong, unique passwords for each platform
   - Enable two-factor authentication where available

2. **Regular Monitoring**
   - Monitor your accounts for unusual activity
   - Review API usage and limits regularly
   - Keep credentials up to date

3. **Compliance**
   - Follow each platform's terms of service
   - Respect posting limits and guidelines
   - Ensure your listings comply with platform policies

4. **Testing**
   - Use sandbox/test environments when available
   - Test with a small number of listings first
   - Monitor for any errors or issues

---

## Support

If you encounter issues with any platform setup:

1. Check the platform's official documentation
2. Verify your account status and permissions
3. Ensure all required fields are filled correctly
4. Contact the platform's support if needed

For technical issues with the Payoff Solar integration, check the application logs and error messages for specific guidance.
