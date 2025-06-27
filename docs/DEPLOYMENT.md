# PayoffSolar Deployment Guide

## Memory Requirements & Optimizations

This application has been optimized to build on servers with limited memory. Here are the available build options:

### Build Commands by Memory Availability

| Available Memory | Command | Node.js Heap Size | Recommended For |
|-----------------|---------|-------------------|-----------------|
| 1.5GB+ | `yarn build-1gb` | 1024MB | Production servers |
| 800MB+ | `yarn build` | 768MB | Standard VPS |
| 640MB+ | `yarn build-low-memory` | 640MB | Low-memory VPS |
| <640MB | Not supported | - | Upgrade required |

### Automated Build Script

Use the automated build script that detects your system memory and chooses the appropriate build command:

```bash
./scripts/build-deploy.sh
```

This script will:
- Check available system memory
- Clean up previous builds and caches
- Choose the optimal build command
- Optionally create swap space on Linux systems
- Run the build process

### Manual Memory Optimization

If you're still experiencing memory issues, try these additional steps:

#### 1. Create Swap Space (Linux)

```bash
# Create 1GB swap file
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent by adding to /etc/fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 2. Close Other Services

Before building, stop unnecessary services:

```bash
# Stop web server temporarily
sudo systemctl stop nginx
sudo systemctl stop apache2

# Stop database if not needed during build
sudo systemctl stop mysql
sudo systemctl stop postgresql
```

#### 3. Clear System Cache

```bash
# Clear system cache
sudo sync && sudo sysctl vm.drop_caches=3

# Clear yarn cache
yarn cache clean

# Clear npm cache
npm cache clean --force
```

### Build Optimizations Applied

The following optimizations have been implemented to reduce memory usage:

1. **Reduced Node.js heap size** - Configured for different memory tiers
2. **Disabled webpack caching** - Reduces memory usage during compilation
3. **Single-threaded compilation** - Prevents memory spikes from parallel processing
4. **Disabled source maps** - Saves memory in production builds
5. **Optimized webpack configuration** - Reduced parallelism and caching

### Deployment Options

#### Option 1: Build Locally, Deploy Files

If your production server has insufficient memory:

1. Build on a local machine or CI/CD with sufficient memory
2. Upload the `.next` folder to your server
3. Run `yarn start` on the server

#### Option 2: Use CI/CD Pipeline

Set up GitHub Actions or similar with sufficient memory:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn build-1gb
      - name: Deploy to server
        # Add your deployment steps here
```

#### Option 3: Upgrade Server Memory

The most straightforward solution is upgrading to a VPS with at least 2GB of memory.

### Troubleshooting

#### "JavaScript heap out of memory" Error

1. Check available memory: `free -h`
2. Try a lower memory build command
3. Create swap space
4. Close other running services

#### Build Takes Too Long

1. The low-memory builds are slower due to reduced parallelism
2. Consider building locally and deploying the built files
3. Use a CI/CD pipeline with more memory

#### Out of Disk Space

1. Clean up old builds: `rm -rf .next`
2. Clear caches: `yarn cache clean`
3. Remove unused dependencies: `yarn install --production`

### Production Recommendations

For production deployments:

1. **Minimum 2GB RAM** for comfortable building and running
2. **SSD storage** for faster I/O during builds
3. **Swap space** equal to RAM size as backup
4. **CI/CD pipeline** for automated deployments
5. **Load balancer** for zero-downtime deployments

### Environment Variables

Make sure these are set in production:

```bash
NODE_ENV=production
DATABASE_URL=your_mysql_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://yourdomain.com
```

### Support

If you continue to experience memory issues after trying these optimizations, consider:

1. Upgrading to a server with more memory
2. Using a build server separate from your production server
3. Implementing a CI/CD pipeline with sufficient resources
