#!/bin/bash

# Payoff Solar Deployment Script
# This script automates the deployment process for the Payoff Solar application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/bitnami/projects/payoffsolar"
PM2_APP_NAME="payoffsolar"
BACKUP_DIR="/opt/bitnami/backups"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create backup
create_backup() {
    print_status "Creating backup..."
    
    # Create backup directory if it doesn't exist
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER "$BACKUP_DIR"
    
    # Create timestamped backup
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/payoffsolar_backup_$TIMESTAMP"
    
    # Copy current build
    if [ -d "$PROJECT_DIR/.next" ]; then
        cp -r "$PROJECT_DIR/.next" "$BACKUP_PATH"
        print_success "Backup created at $BACKUP_PATH"
    else
        print_warning "No existing build found to backup"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Check if required commands exist
    if ! command_exists yarn; then
        print_error "yarn is not installed. Please install yarn first."
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "git is not installed. Please install git first."
        exit 1
    fi
    
    if ! command_exists pm2; then
        print_error "pm2 is not installed. Please install pm2 first: npm install -g pm2"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create one based on .env.example"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to pull latest changes
pull_changes() {
    print_status "Pulling latest changes from git..."
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "There are uncommitted changes in the working directory"
        read -p "Do you want to continue? This will stash your changes. (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled"
            exit 1
        fi
        git stash
        print_status "Changes stashed"
    fi
    
    # Pull latest changes
    git pull origin main
    print_success "Latest changes pulled"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing/updating dependencies..."
    yarn install --frozen-lockfile
    print_success "Dependencies installed"
}

# Function to run database setup if needed
setup_database() {
    print_status "Checking database setup..."
    
    # Check if setup-db script exists and run it
    if [ -f "scripts/setup-db.js" ]; then
        print_status "Running database setup..."
        yarn setup-db
        print_success "Database setup completed"
    else
        print_warning "No database setup script found, skipping..."
    fi
}

# Function to build the application
build_application() {
    print_status "Building the application..."
    yarn build
    print_success "Application built successfully"
}

# Function to restart PM2 process
restart_pm2() {
    print_status "Restarting PM2 process..."
    
    # Check if the PM2 process exists
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        pm2 restart "$PM2_APP_NAME"
        print_success "PM2 process restarted"
    else
        print_warning "PM2 process '$PM2_APP_NAME' not found. Starting new process..."
        pm2 start "yarn start" --name "$PM2_APP_NAME"
        print_success "PM2 process started"
    fi
    
    # Show PM2 status
    pm2 status "$PM2_APP_NAME"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Wait a moment for the application to start
    sleep 5
    
    # Check if the PM2 process is running
    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        print_success "Application is running successfully"
        
        # Show logs
        print_status "Recent logs:"
        pm2 logs "$PM2_APP_NAME" --lines 10 --nostream
    else
        print_error "Application failed to start. Check PM2 logs:"
        pm2 logs "$PM2_APP_NAME" --lines 20 --nostream
        exit 1
    fi
}

# Main deployment function
main() {
    print_status "Starting Payoff Solar deployment..."
    echo "=================================================="
    
    # Change to project directory if not already there
    if [ "$(pwd)" != "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
        print_status "Changing to project directory: $PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
    
    # Run deployment steps
    check_prerequisites
    create_backup
    pull_changes
    install_dependencies
    setup_database
    build_application
    restart_pm2
    verify_deployment
    
    echo "=================================================="
    print_success "Deployment completed successfully!"
    print_status "Application is now running at: http://localhost:6660"
    print_status "To view logs: pm2 logs $PM2_APP_NAME"
    print_status "To monitor: pm2 monit"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
