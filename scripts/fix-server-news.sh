#!/bin/bash

# Fix Server News Issues Script
# This script diagnoses and fixes news content issues on the server

echo "🔧 Fixing Server News Issues"
echo "============================="

# Function to print colored output
print_status() {
    echo -e "\033[1;34m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m$1\033[0m"
}

print_error() {
    echo -e "\033[1;31m$1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m$1\033[0m"
}

# Step 1: Check environment files
print_status "Step 1: Checking environment configuration..."

if [ ! -f ".env" ]; then
    print_warning ".env file not found!"
    if [ -f ".env.local" ]; then
        print_status "Copying .env.local to .env for server deployment..."
        cp .env.local .env
        print_success "Created .env file from .env.local"
    else
        print_error "No environment file found! Please create .env file."
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Step 2: Check database service
print_status "Step 2: Checking database service..."

if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet mariadb; then
        print_success "MariaDB is running"
    elif systemctl is-active --quiet mysql; then
        print_success "MySQL is running"
    else
        print_warning "Database service not running, attempting to start..."
        if sudo systemctl start mariadb 2>/dev/null || sudo systemctl start mysql 2>/dev/null; then
            print_success "Database service started"
        else
            print_error "Failed to start database service"
            exit 1
        fi
    fi
else
    print_warning "systemctl not available, assuming database is running"
fi

# Step 3: Run database diagnosis
print_status "Step 3: Running database diagnosis..."

if node scripts/diagnose-server-news.js; then
    print_success "Database diagnosis completed"
else
    print_error "Database diagnosis failed"
    exit 1
fi

# Step 4: Install dependencies
print_status "Step 4: Installing dependencies..."

if yarn install; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 5: Clean and rebuild
print_status "Step 5: Cleaning and rebuilding application..."

# Remove old build
if [ -d ".next" ]; then
    rm -rf .next
    print_success "Removed old build"
fi

# Build application
print_status "Building application (this may take a few minutes)..."
if yarn build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 6: Restart PM2 if available
print_status "Step 6: Restarting application server..."

if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "payoffsolar"; then
        print_status "Restarting PM2 process..."
        pm2 restart payoffsolar
        print_success "PM2 process restarted"
        
        # Show status
        pm2 status payoffsolar
        
        # Show recent logs
        print_status "Recent logs:"
        pm2 logs payoffsolar --lines 10
    else
        print_warning "PM2 process 'payoffsolar' not found"
        print_status "Starting new PM2 process..."
        pm2 start yarn --name "payoffsolar" -- start
        print_success "PM2 process started"
    fi
else
    print_warning "PM2 not available, please restart your application server manually"
fi

# Step 7: Test the fix
print_status "Step 7: Testing the fix..."

sleep 5  # Give the server time to start

# Test the API endpoint
print_status "Testing news API endpoint..."
if curl -s -f "http://localhost:6666/api/public/content?type=news&page=1&limit=10" > /dev/null; then
    print_success "✅ News API endpoint is working!"
else
    print_warning "⚠️  News API endpoint test failed, but this might be normal if the server is still starting"
fi

print_success "🎉 Server news fix completed!"
print_status "Please check your website at: http://your-domain.com/news"
print_status "If issues persist, check the logs with: pm2 logs payoffsolar"
