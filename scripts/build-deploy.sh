#!/bin/bash

# Build script optimized for low-memory environments
# This script provides different build options based on available memory

set -e

echo "🚀 PayoffSolar Build Script for Low-Memory Environments"
echo "======================================================="

# Function to check available memory (Linux)
check_memory() {
    if command -v free >/dev/null 2>&1; then
        # Linux
        TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
        AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        echo "Total Memory: ${TOTAL_MEM}MB"
        echo "Available Memory: ${AVAILABLE_MEM}MB"
        return $AVAILABLE_MEM
    elif command -v vm_stat >/dev/null 2>&1; then
        # macOS
        echo "macOS detected - memory check not implemented"
        return 2048
    else
        echo "Cannot determine memory - assuming 1GB"
        return 1024
    fi
}

# Function to create swap file if needed (Linux only)
create_swap() {
    local swap_size=$1
    echo "Creating ${swap_size}MB swap file..."
    
    if [ ! -f /swapfile ]; then
        sudo fallocate -l ${swap_size}M /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo "Swap file created and activated"
    else
        echo "Swap file already exists"
    fi
}

# Function to clean up before build
cleanup_before_build() {
    echo "🧹 Cleaning up before build..."
    
    # Remove previous build
    rm -rf .next
    
    # Clear yarn cache
    yarn cache clean
    
    # Clear npm cache if npm is available
    if command -v npm >/dev/null 2>&1; then
        npm cache clean --force
    fi
    
    echo "Cleanup completed"
}

# Function to choose build command based on memory
choose_build_command() {
    local available_mem=$1
    
    if [ $available_mem -gt 1500 ]; then
        echo "build-1gb"
    elif [ $available_mem -gt 800 ]; then
        echo "build"
    elif [ $available_mem -gt 600 ]; then
        echo "build-low-memory"
    else
        echo "insufficient-memory"
    fi
}

# Main execution
main() {
    echo "Checking system memory..."
    check_memory
    AVAILABLE_MEM=$?
    
    BUILD_CMD=$(choose_build_command $AVAILABLE_MEM)
    
    if [ "$BUILD_CMD" = "insufficient-memory" ]; then
        echo "❌ Insufficient memory detected (${AVAILABLE_MEM}MB available)"
        echo "Minimum 640MB required for build"
        
        if command -v free >/dev/null 2>&1; then
            echo "Would you like to create a swap file? (y/n)"
            read -r response
            if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
                create_swap 1024
                AVAILABLE_MEM=1024
                BUILD_CMD="build-low-memory"
            else
                echo "Exiting - please upgrade to a server with more memory"
                exit 1
            fi
        else
            echo "Please upgrade to a server with at least 1GB of memory"
            exit 1
        fi
    fi
    
    echo "Selected build command: yarn $BUILD_CMD"
    echo "This will use approximately $(echo $BUILD_CMD | grep -o '[0-9]*' | head -1)MB of memory"
    
    cleanup_before_build
    
    echo "🔨 Starting build process..."
    yarn $BUILD_CMD
    
    echo "✅ Build completed successfully!"
    echo "📦 Build output is in the .next directory"
    
    # Show build size
    if [ -d ".next" ]; then
        BUILD_SIZE=$(du -sh .next | cut -f1)
        echo "Build size: $BUILD_SIZE"
    fi
}

# Run main function
main "$@"
