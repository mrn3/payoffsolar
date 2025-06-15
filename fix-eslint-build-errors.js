#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript and JavaScript files
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

// Function to fix common ESLint issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix unused variables prefixed with underscore (but not in destructuring)
  content = content.replace(/const\s+_(\w+)\s*=/g, 'const $1 =');

  // Fix unused parameters prefixed with underscore
  content = content.replace(/\(\s*_(\w+):/g, '($1:');
  content = content.replace(/async\s+\(\s*_(\w+):/g, 'async ($1:');

  // Fix unused catch variables
  content = content.replace(/catch\s*\(\s*_(\w+):/g, 'catch ($1:');

  // Fix unused destructured variables
  content = content.replace(/{\s*_(\w+)\s*}/g, '{ $1 }');

  // Fix unescaped quotes in JSX content (not in imports or strings)
  // Only fix quotes that are clearly in JSX content
  content = content.replace(/>([^<]*)'([^<]*)</g, '>$1&apos;$2<');
  content = content.replace(/>([^<]*)"([^<]*)</g, '>$1&quot;$2<');

  // Fix unused assignment variables
  content = content.replace(/const\s+_(\w+)\s*=\s*await/g, 'const $1 = await');

  modified = true; // Always write back since we made changes

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to check...`);

files.forEach(file => {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log('Done!');
