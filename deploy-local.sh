#!/bin/bash

# Payoff Solar Local Development Deployment Script
# This script is for local development and testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating one from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your configuration before running the app"
        else
            print_error ".env.example not found. Please create .env file manually."
            exit 1
        fi
    fi
    
    print_success "Prerequisites checked"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing/updating dependencies..."
    yarn install
    print_success "Dependencies installed"
}

# Function to run database setup
setup_database() {
    print_status "Setting up database..."

    # Check if MySQL is running
    if command_exists mysql; then
        print_status "MySQL found, running database setup..."
        if [ -f "scripts/setup-db.js" ]; then
            yarn setup-db
            print_success "Database setup completed"
        else
            print_warning "Database setup script not found"
        fi
    else
        print_warning "MySQL not found. Please install and configure MySQL first."
        print_status "You can install MySQL using: brew install mysql (on macOS)"
    fi
}

# Function to setup upload directories
setup_uploads() {
    print_status "Setting up upload directories..."

    if [ -f "scripts/setup-uploads.js" ]; then
        node scripts/setup-uploads.js
        print_success "Upload directories setup completed"
    else
        print_warning "Upload setup script not found"
    fi
}

# Function to build the application
build_application() {
    print_status "Building the application..."
    yarn build
    print_success "Application built successfully"
}

# Function to start the application
start_application() {
    print_status "Starting the application..."
    print_status "The application will start on http://localhost:3000"
    print_status "Press Ctrl+C to stop the application"
    
    # Start the application
    yarn start
}

# Function to run in development mode
run_development() {
    print_status "Starting development server..."
    print_status "The development server will start on http://localhost:3000"
    print_status "Press Ctrl+C to stop the development server"
    
    # Start development server
    yarn dev
}

# Main function
main() {
    print_status "Payoff Solar Local Deployment"
    echo "============================================"
    
    # Parse command line arguments
    MODE="production"
    if [ "$1" = "dev" ] || [ "$1" = "development" ]; then
        MODE="development"
    fi
    
    # Run setup steps
    check_prerequisites
    install_dependencies
    setup_uploads

    if [ "$MODE" = "development" ]; then
        setup_database
        run_development
    else
        setup_database
        build_application
        start_application
    fi
}

# Show usage if help is requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Payoff Solar Local Deployment Script"
    echo ""
    echo "Usage:"
    echo "  ./deploy-local.sh              # Build and start in production mode"
    echo "  ./deploy-local.sh dev          # Start in development mode"
    echo "  ./deploy-local.sh development  # Start in development mode"
    echo "  ./deploy-local.sh --help       # Show this help"
    echo ""
    echo "The application will be available at http://localhost:3000"
    exit 0
fi

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
