#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to fix broken quotes in imports and directives
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix broken 'use client' and 'use server' directives
  if (content.includes('&apos;use client&apos;') || content.includes('&apos;use server&apos;')) {
    content = content.replace(/&apos;use client&apos;/g, "'use client'");
    content = content.replace(/&apos;use server&apos;/g, "'use server'");
    modified = true;
  }

  // Fix broken import statements
  if (content.includes('from &apos;')) {
    content = content.replace(/from &apos;([^&]*)&apos;/g, "from '$1'");
    modified = true;
  }

  // Fix broken import paths
  if (content.includes('import.*&apos;')) {
    content = content.replace(/import ([^}]*) from &apos;([^&]*)&apos;/g, "import $1 from '$2'");
    content = content.replace(/import &apos;([^&]*)&apos;/g, "import '$1'");
    modified = true;
  }

  // Fix broken require statements
  if (content.includes('require(&apos;')) {
    content = content.replace(/require\(&apos;([^&]*)&apos;\)/g, "require('$1')");
    modified = true;
  }

  // Fix broken export statements
  if (content.includes('export.*&apos;')) {
    content = content.replace(/export ([^}]*) from &apos;([^&]*)&apos;/g, "export $1 from '$2'");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed broken quotes in: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to check...`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed broken quotes in ${fixedCount} files.`);
