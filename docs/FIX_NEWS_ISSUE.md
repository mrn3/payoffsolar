# Fix News Page Issue

## Problem
The news page shows "Failed to load news posts" error on the server but works fine locally.

## Root Cause
The issue is likely caused by one or more of these factors:
1. **Environment Variables**: Server not loading from `.env` file properly
2. **Database Migration**: News content type missing (blog → news migration not run)
3. **Build Issues**: Next.js build not including latest changes
4. **Database Connection**: Server can't connect to MySQL/MariaDB

## Solution

### Quick Fix (Recommended)
Run the automated fix script on your server:

```bash
# SSH into your server
ssh your-server

# Navigate to project directory
cd /path/to/payoffsolar

# Run the fix script
./scripts/fix-server-news.sh
```

This script will:
- ✅ Check environment configuration
- ✅ Verify database service is running
- ✅ Diagnose database issues
- ✅ Fix missing content types
- ✅ Rebuild the application
- ✅ Restart the server
- ✅ Test the fix

### Manual Diagnosis
If you want to diagnose the issue manually:

```bash
# 1. Check environment variables
cat .env | grep MYSQL

# 2. Test database connection
node scripts/diagnose-server-news.js

# 3. Check for missing content types
node scripts/check-and-fix-news.js

# 4. Test API endpoint
node scripts/test-news-api.js
```

### Manual Fix Steps
If the automated script doesn't work:

1. **Fix Environment Loading**:
   ```bash
   # Ensure .env file exists (not just .env.local)
   cp .env.local .env  # if needed
   ```

2. **Fix Database Issues**:
   ```bash
   # Run database setup
   node scripts/setup-db.js
   
   # Run news migration
   node scripts/check-and-fix-news.js
   ```

3. **Rebuild Application**:
   ```bash
   # Clean build
   rm -rf .next
   yarn build
   
   # Restart server
   pm2 restart payoffsolar
   ```

## Verification
After running the fix:

1. **Check API**: Visit `http://your-domain.com/api/public/content?type=news`
2. **Check News Page**: Visit `http://your-domain.com/news`
3. **Check Logs**: Run `pm2 logs payoffsolar` for any errors

## Files Modified
The fix includes these changes:

- ✅ `src/lib/mysql/init.ts` - Fixed environment loading
- ✅ `src/app/api/public/content/route.ts` - Added debug logging
- ✅ Added diagnostic scripts in `scripts/` directory

## Prevention
To prevent this issue in the future:

1. **Always use `.env` file on servers** (not `.env.local`)
2. **Run database migrations** after code updates
3. **Test API endpoints** after deployment
4. **Check PM2 logs** regularly for errors

## Support
If the issue persists after running these fixes:

1. Check PM2 logs: `pm2 logs payoffsolar`
2. Verify database connection: `node scripts/test-database-connection.js`
3. Check server resources: `free -h` and `df -h`
4. Restart the entire server if needed

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `fix-server-news.sh` | Automated fix for all news issues |
| `diagnose-server-news.js` | Comprehensive diagnosis |
| `check-and-fix-news.js` | Fix content type issues |
| `test-news-api.js` | Test API endpoints |
| `test-news-content.js` | Test database content |
