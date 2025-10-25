#!/bin/bash

# Server Deployment Script for Database Configuration Fix
# Run this script on your production server

set -e  # Exit on any error

echo "🚀 Starting Payoff Solar server deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating from template..."
    cp .env.local .env
    echo "📝 Please edit .env file with your production settings:"
    echo "   - MYSQL_PASSWORD"
    echo "   - NEXT_PUBLIC_SITE_URL"
    echo "   - AWS_REGION"
    echo "   - SES_FROM_EMAIL"
    echo "   - SES_FROM_NAME"
    echo "   - JWT_SECRET"
    echo "   - (Optional) AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo ""
    echo "Press Enter when you've updated the .env file..."
    read
fi

# Check if MariaDB/MySQL is running
echo "🔍 Checking database service..."
if ! systemctl is-active --quiet mariadb; then
    echo "⚠️  MariaDB is not running. Starting it..."
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Test database connection
echo "🔍 Testing database connection..."
if node scripts/setup-db.js; then
    echo "✅ Database setup successful"
else
    echo "❌ Database setup failed. Please check your .env configuration."
    exit 1
fi

# Setup upload directories
echo "🗂️  Setting up upload directories..."
if node scripts/setup-uploads.js; then
    echo "✅ Upload directories setup successful"
else
    echo "⚠️  Upload directories setup had issues, but continuing..."
fi

# Build the application
echo "🏗️  Building application..."
yarn build

# Restart PM2
echo "🔄 Restarting PM2 process..."
if pm2 list | grep -q "payoffsolar"; then
    pm2 restart payoffsolar
else
    echo "⚠️  PM2 process 'payoffsolar' not found. Starting new process..."
    pm2 start "yarn start" --name "payoffsolar"
fi

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 To check logs: pm2 logs payoffsolar"
echo "🌐 Test your site: curl -I http://localhost:3000"
echo ""
echo "If you still see 'data is not defined' errors:"
echo "1. Check PM2 logs: pm2 logs payoffsolar"
echo "2. Verify .env file has correct database credentials"
echo "3. Test database connection: node scripts/setup-db.js"
echo "4. Clear browser cache and cookies"
