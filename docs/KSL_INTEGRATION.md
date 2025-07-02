# KSL Classifieds Integration

This document explains how to use the KSL Classifieds integration for automated listing creation.

## Overview

The KSL integration uses web automation (Puppeteer) to create, update, and manage listings on KSL Classifieds. Since KSL doesn't provide a public API, this integration automates the web interface.

## Setup

### 1. KSL Account Requirements

- You need a valid KSL account with login credentials
- Your account should be in good standing with KSL
- Ensure you comply with KSL's terms of service for automated posting

### 2. Admin Dashboard Configuration

Configure your KSL credentials in the admin dashboard:

1. Go to **Dashboard > Settings > Platforms**
2. Find the **KSL Classifieds** platform
3. Enter your KSL credentials:
   - **Username**: Your KSL email address
   - **Password**: Your KSL password
4. Click **Test Authentication** to verify your credentials
5. Save the configuration

### 3. Dependencies

The integration requires Puppeteer, which is already installed:

```bash
yarn add puppeteer
```

## Features

### ✅ Implemented Features

- **Authentication**: Automated login to KSL using credentials
- **Listing Creation**: Create new listings with title, description, price, images
- **Listing Updates**: Update existing listings
- **Listing Deletion**: Remove listings from KSL
- **Status Checking**: Check if listings are active, expired, or deleted
- **Image Upload**: Support for uploading product images
- **Category Mapping**: Maps product categories to KSL categories
- **Location Support**: Set listing location (city, state, zip)
- **Contact Preferences**: Configure contact methods and phone visibility

### 🔄 Automated Features

- **Browser Management**: Automatically launches and manages Chrome browser
- **Session Handling**: Maintains login session across operations
- **Error Recovery**: Handles common errors and retries operations
- **Image Processing**: Downloads and uploads images from URLs
- **Form Validation**: Ensures all required fields are filled

## Usage

### Basic Listing Creation

```javascript
import { KslService } from '@/lib/services/listing/ksl';

// Create service instance
const kslService = new KslService(platform, credentials);

// Create a listing
const result = await kslService.createListing({
  title: 'Solar Panel - 400W Monocrystalline',
  description: 'High-efficiency solar panel for residential use...',
  price: 299.99,
  images: ['/path/to/image1.jpg', '/path/to/image2.jpg'],
  category: 'solar-panels',
  condition: 'new',
  location: {
    city: 'Salt Lake City',
    state: 'UT',
    zipCode: '84101'
  }
});

if (result.success) {
  console.log('Listing created:', result.listingUrl);
} else {
  console.error('Error:', result.error);
}
```

### Category Mapping

The integration maps product categories to KSL categories:

- `solar-panels` → `electronics`
- `inverters` → `electronics`
- `batteries` → `electronics`
- `mounting-systems` → `home_garden`
- `accessories` → `electronics`

### Image Handling

- Supports up to 8 images (KSL limit)
- Can handle both local file paths and URLs
- Automatically downloads images from URLs to temporary storage
- Resizes images if needed

## Configuration

### Platform Settings

In the admin dashboard, configure the KSL platform with:

- **Display Name**: KSL Classifieds
- **API Endpoint**: https://classifieds.ksl.com
- **Max Title Length**: 100 characters
- **Max Description Length**: 4000 characters
- **Max Images**: 8

### Credentials

Set up credentials in the platform settings:

- **Username**: Your KSL email address
- **Password**: Your KSL password

## Testing

Run the test script to verify the integration:

```bash
node scripts/test-ksl.js
```

This will test:
- Credential validation
- Authentication
- Basic listing creation
- Status checking

## Important Notes

### ⚠️ Compliance and Best Practices

1. **Rate Limiting**: Don't create listings too frequently to avoid being flagged
2. **Terms of Service**: Ensure compliance with KSL's terms of service
3. **Content Quality**: Use high-quality descriptions and images
4. **Accurate Information**: Ensure all listing information is accurate

### 🔒 Security

- Credentials are stored securely in the database
- Browser runs in headless mode for security
- Temporary files are cleaned up automatically
- Session data is not persisted

### 🐛 Troubleshooting

**Authentication Fails**:
- Verify credentials are correct
- Check if KSL account is locked or suspended
- Ensure no CAPTCHA is required

**Listing Creation Fails**:
- Check if all required fields are provided
- Verify images are accessible
- Ensure category mapping is correct

**Browser Issues**:
- Make sure Puppeteer dependencies are installed
- Check system resources (memory, disk space)
- Verify Chrome/Chromium is available

## Limitations

- Requires active browser session (uses more resources)
- Dependent on KSL's website structure (may break if they change their UI)
- No real-time notifications from KSL
- Limited to KSL's posting frequency limits

## Future Enhancements

- [ ] Bulk listing operations
- [ ] Listing scheduling
- [ ] Advanced image optimization
- [ ] Better error recovery
- [ ] Performance monitoring
- [ ] Integration with KSL messaging system
