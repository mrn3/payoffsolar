#!/usr/bin/env node

/**
 * Setup script for upload directories
 * Ensures proper directory structure and permissions for file uploads
 */

const fs = require('fs');
const path = require('path');

const uploadDirs = [
  'public/uploads',
  'public/uploads/products'
];

function createUploadDirectories() {
  console.log('🗂️  Setting up upload directories...');
  
  for (const dir of uploadDirs) {
    const fullPath = path.join(process.cwd(), dir);
    
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`✅ Directory already exists: ${dir}`);
      }
      
      // Check if directory is writable
      fs.accessSync(fullPath, fs.constants.W_OK);
      console.log(`✅ Directory is writable: ${dir}`);
      
    } catch (error) {
      console.error(`❌ Error with directory ${dir}:`, error.message);
      
      // Try to fix permissions
      try {
        if (process.platform !== 'win32') {
          const { execSync } = require('child_process');
          execSync(`chmod 755 ${fullPath}`);
          console.log(`✅ Fixed permissions for: ${dir}`);
        }
      } catch (permError) {
        console.error(`❌ Could not fix permissions for ${dir}:`, permError.message);
        console.log(`💡 Try running: chmod 755 ${fullPath}`);
      }
    }
  }
  
  console.log('✅ Upload directory setup complete!');
}

function checkExistingUploads() {
  console.log('🔍 Checking for existing uploads...');
  
  const productsDir = path.join(process.cwd(), 'public/uploads/products');
  
  try {
    const files = fs.readdirSync(productsDir);
    const imageFiles = files.filter(file => 
      file.match(/\.(jpg|jpeg|png|webp)$/i) && 
      !file.startsWith('.gitkeep')
    );
    
    if (imageFiles.length > 0) {
      console.log(`📸 Found ${imageFiles.length} existing product images:`);
      imageFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));
      if (imageFiles.length > 5) {
        console.log(`   ... and ${imageFiles.length - 5} more`);
      }
    } else {
      console.log('📸 No existing product images found');
    }
  } catch (error) {
    console.log('📸 Could not check existing uploads (directory may not exist yet)');
  }
}

function main() {
  console.log('🚀 Payoff Solar Upload Directory Setup');
  console.log('=====================================');
  
  createUploadDirectories();
  checkExistingUploads();
  
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Commit and push the .gitkeep files to preserve directory structure');
  console.log('   2. On your server, run this script after deployment');
  console.log('   3. Ensure your web server (Apache/Nginx) can serve files from public/uploads/');
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { createUploadDirectories, checkExistingUploads };
