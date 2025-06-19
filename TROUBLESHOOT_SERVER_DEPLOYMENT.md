# Server Deployment Troubleshooting Guide

## Issue: Image Upload Still Getting 404 Error After Deployment

### Step 1: Verify Code Deployment

SSH into your server and check if the latest changes are deployed:

```bash
cd /opt/bitnami/projects/payoffsolar

# Check current git status
git status
git log --oneline -5

# Check if the credentials: 'include' changes are present
grep -n "credentials.*include" src/app/\(dashboard\)/dashboard/products/\[id\]/edit/page.tsx
grep -n "credentials.*include" src/components/ui/ImageUpload.tsx
```

### Step 2: Verify API Route Exists

Check if the API route file exists and has the correct content:

```bash
# Check if the API route file exists
ls -la src/app/api/products/\[id\]/images/route.ts

# Check the content
cat src/app/api/products/\[id\]/images/route.ts | head -20
```

### Step 3: Check Server Logs

```bash
# Check PM2 logs for any errors
pm2 logs payoffsolar --lines 50

# Check if the server is running
pm2 status
```

### Step 4: Test API Directly

Test the API endpoint directly on the server:

```bash
# First, get a valid auth token by logging in
curl -c /tmp/cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"matt@payoffsolar.com","password":"admin123"}' \
  http://localhost:6660/api/auth/signin

# Test the products API to get a valid product ID
curl -b /tmp/cookies.txt http://localhost:6660/api/products | jq '.products[0].id'

# Test the images API with a valid product ID (replace PRODUCT_ID)
curl -b /tmp/cookies.txt http://localhost:6660/api/products/PRODUCT_ID/images
```

### Step 5: Force Rebuild and Restart

If the changes aren't reflected, force a complete rebuild:

```bash
cd /opt/bitnami/projects/payoffsolar

# Pull latest changes
git pull

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
yarn install

# Rebuild
yarn build

# Restart PM2
pm2 restart payoffsolar

# Check logs
pm2 logs payoffsolar --lines 20
```

### Step 6: Check Browser Cache

Clear your browser cache and cookies for the site, or try in an incognito window.

### Step 7: Verify Environment Variables

Check if all required environment variables are set:

```bash
# Check if .env file exists and has required variables
cat .env | grep -E "(MYSQL_|JWT_SECRET)"
```

### Step 8: Test Database Connection

```bash
# Test database connection
node scripts/test-db-connection.js
```

## Common Issues and Solutions

### Issue: Changes not reflected after deployment
**Solution**: 
1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `yarn build`
3. Restart PM2: `pm2 restart payoffsolar`

### Issue: 404 on API routes
**Solution**: 
1. Check if API route files exist in correct location
2. Verify Next.js build completed successfully
3. Check PM2 logs for build errors

### Issue: Authentication errors
**Solution**: 
1. Clear browser cookies
2. Check JWT_SECRET in .env file
3. Verify database connection

### Issue: Product ID not found
**Solution**: 
1. Check if the product ID in the URL exists in database
2. Use the debug API to list products: `curl http://localhost:6660/api/debug/products`

## Quick Debug Commands

```bash
# Check if server is responding
curl -I http://localhost:6660

# Check if API routes are working
curl http://localhost:6660/api/debug/products

# Check PM2 status
pm2 status

# View recent logs
pm2 logs payoffsolar --lines 30

# Check disk space
df -h

# Check memory usage
free -h
```

## If All Else Fails

1. **Complete redeploy**:
   ```bash
   cd /opt/bitnami/projects/payoffsolar
   git reset --hard HEAD
   git pull
   rm -rf node_modules .next
   yarn install
   yarn build
   pm2 restart payoffsolar
   ```

2. **Check server resources**: Ensure the server has enough memory and disk space

3. **Contact support**: If the issue persists, provide the output of:
   - `pm2 logs payoffsolar --lines 50`
   - `curl -I http://localhost:6660/api/products`
   - `git log --oneline -5`
