# Image Upload Fix for Production Server

## Problem
Image uploads work fine locally but return 404 errors on the production server. This happens because:

1. The `public/uploads` directory is gitignored, so uploaded images don't get deployed to the server
2. The upload directory structure doesn't exist on the server
3. Directory permissions may not be set correctly

## Solution

### 1. Updated .gitignore
The `.gitignore` file has been updated to:
- Ignore actual uploaded files (`public/uploads/*`)
- Preserve directory structure with `.gitkeep` files
- Allow the upload directories to be tracked in git

### 2. Added .gitkeep Files
Created `.gitkeep` files to preserve the directory structure:
- `public/uploads/.gitkeep`
- `public/uploads/products/.gitkeep`

### 3. Created Upload Setup Script
Added `scripts/setup-uploads.js` to:
- Create upload directories if they don't exist
- Check and fix directory permissions
- Verify existing uploads

### 4. Updated Deployment Scripts
Both `deploy-server.sh` and `deploy-local.sh` now include upload directory setup.

## Deployment Steps

### For Production Server

1. **Commit and push the changes:**
   ```bash
   git add .
   git commit -m "Fix image upload directory structure for production"
   git push
   ```

2. **Deploy to server:**
   ```bash
   cd /opt/bitnami/projects/payoffsolar
   ./deploy-server.sh
   ```

   Or manually:
   ```bash
   git pull
   yarn install
   yarn setup-uploads
   yarn build
   pm2 restart payoffsolar
   ```

3. **Verify upload directories exist:**
   ```bash
   ls -la public/uploads/
   ls -la public/uploads/products/
   ```

4. **Check directory permissions:**
   ```bash
   # Should show drwxr-xr-x or similar
   ls -ld public/uploads/products/
   ```

### For Local Development

Run the setup script:
```bash
yarn setup-uploads
```

## Testing the Fix

1. **Upload a new image** through the admin dashboard
2. **Check if the image appears** in the product edit page
3. **Verify the image URL** works in the browser
4. **Check the file exists** on the server:
   ```bash
   ls -la public/uploads/products/
   ```

## Troubleshooting

### Issue: Directory permissions denied
**Solution:**
```bash
chmod 755 public/uploads/
chmod 755 public/uploads/products/
```

### Issue: Images still not showing
**Solutions:**
1. Check if the upload directory exists:
   ```bash
   ls -la public/uploads/products/
   ```

2. Check web server configuration (Apache/Nginx) allows serving static files from `/uploads/`

3. Verify the image URLs in the database match the actual file paths

4. Check PM2 logs for any errors:
   ```bash
   pm2 logs payoffsolar
   ```

### Issue: Upload fails with "Cannot create directory"
**Solution:**
```bash
# Ensure the parent directory exists and is writable
mkdir -p public/uploads/products
chmod 755 public/uploads/products
```

## Web Server Configuration

### Apache (if using Apache)
Ensure your Apache configuration allows serving files from the uploads directory. The default Bitnami configuration should work, but verify:

```apache
# In your virtual host or .htaccess
<Directory "/opt/bitnami/projects/payoffsolar/public/uploads">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```

### Nginx (if using Nginx)
Add a location block for uploads:

```nginx
location /uploads/ {
    alias /opt/bitnami/projects/payoffsolar/public/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Considerations

1. **File type validation** is already implemented in the upload API
2. **File size limits** are enforced (5MB max)
3. **Authentication required** for uploads (admin only)
4. **Unique filenames** prevent conflicts and directory traversal

## Monitoring

To monitor upload functionality:

1. **Check disk space** regularly:
   ```bash
   df -h
   du -sh public/uploads/
   ```

2. **Monitor upload logs** in PM2:
   ```bash
   pm2 logs payoffsolar | grep -i upload
   ```

3. **Set up log rotation** if uploads are frequent

This fix ensures that image uploads work consistently across both local development and production environments.
