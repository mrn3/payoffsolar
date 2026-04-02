#!/bin/bash

# Trip Planner Feature Deployment Script
# This script deploys the Trip Planner feature to your production server

set -e  # Exit on any error

echo "🚀 Deploying Trip Planner Feature to Production"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_status() {
    echo -e "📋 $1"
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if migration file exists
if [ ! -f "migrations/add_trips_tables.sql" ]; then
    print_error "Error: Migration file not found at migrations/add_trips_tables.sql"
    exit 1
fi

# Step 1: Commit changes to git
print_status "Step 1: Committing changes to git..."
echo ""
echo "Current git status:"
git status --short

echo ""
read -p "Do you want to commit these changes? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter commit message (default: 'Add Trip Planner feature'): " commit_msg
    commit_msg=${commit_msg:-"Add Trip Planner feature"}
    
    git add .
    git commit -m "$commit_msg"
    print_success "Changes committed"
else
    print_warning "Skipping git commit. Make sure to commit before deploying!"
fi

# Step 2: Push to remote
print_status "Step 2: Pushing to remote repository..."
read -p "Push to remote? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    print_success "Pushed to remote"
else
    print_warning "Skipping git push"
fi

# Step 3: Deploy to server
print_status "Step 3: Deploying to production server..."
echo ""

# Check if SSH config exists for payoffsolar
if ! ssh -q payoffsolar exit 2>/dev/null; then
    print_error "Cannot connect to 'payoffsolar' server via SSH"
    echo "Please ensure SSH is configured correctly in ~/.ssh/config"
    exit 1
fi

print_status "Connected to production server"
echo ""

# Deploy using the existing deploy-server.sh script
print_status "Running deployment script on server..."
ssh payoffsolar << 'ENDSSH'
#!/bin/bash
set -e

cd /opt/bitnami/projects/payoffsolar

echo "📥 Pulling latest changes..."
git pull origin main

echo "📊 Running database migration..."
# Check if migration has already been run
if mysql -u root -p$(grep MYSQL_PASSWORD .env | cut -d '=' -f2) payoffsolar -e "SHOW TABLES LIKE 'trips';" | grep -q trips; then
    echo "⚠️  Trips table already exists, skipping migration"
else
    mysql -u root -p$(grep MYSQL_PASSWORD .env | cut -d '=' -f2) < migrations/add_trips_tables.sql
    echo "✅ Database migration completed"
fi

echo "📦 Installing dependencies..."
yarn install

echo "🏗️  Building application..."
yarn build

echo "🔄 Restarting PM2..."
pm2 restart payoffsolar

echo "📊 Checking PM2 status..."
pm2 status

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Verifying deployment..."
if mysql -u root -p$(grep MYSQL_PASSWORD .env | cut -d '=' -f2) payoffsolar -e "SHOW TABLES LIKE 'trip%';" | grep -q trips; then
    echo "✅ Database tables created successfully"
else
    echo "❌ Database tables not found"
    exit 1
fi

ENDSSH

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    echo "🎉 Trip Planner feature is now live on production!"
    echo ""
    echo "Next steps:"
    echo "1. Visit https://yourdomain.com/dashboard/trip-planner"
    echo "2. Create a test trip to verify functionality"
    echo "3. Check PM2 logs if you encounter any issues: ssh payoffsolar 'pm2 logs payoffsolar'"
    echo ""
    echo "📚 Full documentation: docs/TRIP_PLANNER_DEPLOYMENT.md"
else
    print_error "Deployment failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check PM2 logs: ssh payoffsolar 'pm2 logs payoffsolar --lines 50'"
    echo "2. Check MySQL error logs: ssh payoffsolar 'sudo tail -f /var/log/mysql/error.log'"
    echo "3. Verify database connection: ssh payoffsolar 'cd /opt/bitnami/projects/payoffsolar && node scripts/test-db-connection.js'"
    echo ""
    echo "📚 See docs/TRIP_PLANNER_DEPLOYMENT.md for detailed troubleshooting"
    exit 1
fi
