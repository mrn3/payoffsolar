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

// Function to fix broken string literals
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix broken string literals in function calls and object properties
  const stringLiteralFixes = [
    // Fix string literals in function calls like .email('message')
    [/\.email\(&apos;([^&]*)&apos;\)/g, ".email('$1')"],
    [/\.min\(\d+,\s*&apos;([^&]*)&apos;\)/g, (match, message) => {
      const num = match.match(/\.min\((\d+),/)[1];
      return `.min(${num}, '${message}')`;
    }],
    [/\.max\(\d+,\s*&apos;([^&]*)&apos;\)/g, (match, message) => {
      const num = match.match(/\.max\((\d+),/)[1];
      return `.max(${num}, '${message}')`;
    }],
    
    // Fix object property values
    [/:\s*&apos;([^&]*)&apos;,/g, ": '$1',"],
    [/:\s*&apos;([^&]*)&apos;$/gm, ": '$1'"],
    [/:\s*&apos;([^&]*)&apos;\s*}/g, ": '$1' }"],
    
    // Fix message properties in objects
    [/message:\s*&apos;([^&]*)&apos;/g, "message: '$1'"],
    
    // Fix console.log and similar function calls
    [/console\.(log|error|warn|info)\(&apos;([^&]*)&apos;\)/g, "console.$1('$2')"],
    
    // Fix toast messages
    [/toast\.(success|error|info|warning)\(&apos;([^&]*)&apos;\)/g, "toast.$1('$2')"],
    
    // Fix throw new Error
    [/throw new Error\(&apos;([^&]*)&apos;\)/g, "throw new Error('$1')"],
    
    // Fix alert calls
    [/alert\(&apos;([^&]*)&apos;\)/g, "alert('$1')"],
    
    // Fix confirm calls
    [/confirm\(&apos;([^&]*)&apos;\)/g, "confirm('$1')"],
  ];

  stringLiteralFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed broken string literals in: ${filePath}`);
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

console.log(`Fixed broken string literals in ${fixedCount} files.`);
