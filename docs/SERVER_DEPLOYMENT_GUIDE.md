# Server Deployment Guide - Database Configuration Fix

## Issues Fixed

The "data is not defined" error was caused by several variable naming inconsistencies in the authentication code. These have been fixed:

1. **API Routes**: Fixed variable naming in signin, signup, and forgot-password routes
2. **Auth Library**: Fixed JWT token generation and verification functions
3. **Login Page**: Fixed response variable references
4. **Database Interfaces**: Standardized User and UserProfile interfaces to use `id` instead of `_id`

## Server Environment Configuration

### 1. Update Environment Variables

Your server needs a `.env` file (not `.env.local`). A template has been created at `.env` in your project root.

**IMPORTANT**: Update these values for your production server:

```bash
# Edit the .env file on your server
vi /opt/bitnami/projects/payoffsolar/.env
```

Update these critical values:
- `MYSQL_PASSWORD`: Your actual MySQL/MariaDB password
- `NEXT_PUBLIC_SITE_URL`: Your production domain (e.g., https://payoffsolar.com)
- `AWS_REGION`: Your AWS region for SES (e.g., us-west-2)
- `SES_FROM_EMAIL`: Your verified SES sender email (must be verified in SES)
- `SES_FROM_NAME`: Sender display name (e.g., Payoff Solar)
- `JWT_SECRET`: Change to a secure random string
- Optional (if not using an instance role or other AWS auth): `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### 2. Database Setup on Server

Make sure your MySQL/MariaDB is properly configured:

```bash
# Check if MariaDB is running
sudo systemctl status mariadb

# If not running, start it
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Run database setup
cd /opt/bitnami/projects/payoffsolar
node scripts/setup-db.js
```

### 3. Create Admin User

After database setup, create your admin user:

```bash
node scripts/create-admin-user.js
```

### 4. Deploy Updated Code

```bash
cd /opt/bitnami/projects/payoffsolar

# Pull latest changes
git pull

# Install dependencies
yarn install

# Build the application
yarn build

# Restart PM2
pm2 restart payoffsolar

# Check status
pm2 status
pm2 logs payoffsolar
```

## Testing the Fix

1. **Check Environment Variables**:
   ```bash
   # Test database connection
   node scripts/test-order-date.js
   ```

2. **Test Login**:
   - Go to your domain/login
   - Try logging in with matt@payoffsolar.com
   - Check PM2 logs for any errors: `pm2 logs payoffsolar`

3. **Check Database Connection**:
   ```bash
   # Connect to MySQL and verify tables exist
   mysql -u root -p payoffsolar
   SHOW TABLES;
   SELECT * FROM users LIMIT 1;
   ```

## Common Issues and Solutions

### Issue: "Connection refused" to MySQL
**Solution**: 
```bash
sudo systemctl start mariadb
sudo mysql_secure_installation
```

### Issue: "Access denied for user 'root'"
**Solution**: Update MYSQL_PASSWORD in .env file with correct password

### Issue: "Database 'payoffsolar' doesn't exist"
**Solution**: 
```bash
node scripts/setup-db.js
```

### Issue: Still getting "data is not defined"
**Solution**: 
1. Check PM2 logs: `pm2 logs payoffsolar`
2. Restart PM2: `pm2 restart payoffsolar`
3. Clear browser cache and cookies

## Environment File Template

Your `.env` file should look like this (update the values):

```env
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-actual-mysql-password
MYSQL_DATABASE=payoffsolar

# JWT Secret - CHANGE THIS!
JWT_SECRET=your-super-secure-random-string-here

# Site URL - UPDATE THIS!
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Stripe (update with production keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# AWS SES (update with production settings)
AWS_REGION=us-west-2
# If not using an instance role or other AWS auth, set the following:
# AWS_ACCESS_KEY_ID=your-aws-access-key-id
# AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=Payoff Solar
```

## Next Steps

1. Update the `.env` file on your server with correct values
2. Run the database setup script
3. Deploy the updated code
4. Test the login functionality
5. Monitor PM2 logs for any remaining issues

The code fixes should resolve the "data is not defined" errors you were experiencing.
