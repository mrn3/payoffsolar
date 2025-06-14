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

// Function to fix all broken string literals
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix all remaining broken string literals
  const fixes = [
    // Fix empty string literals
    [/:\s*&apos;&apos;,/g, ": '',"],
    [/:\s*&apos;&apos;$/gm, ": ''"],
    [/:\s*&apos;&apos;\s*}/g, ": '' }"],
    [/:\s*&apos;&apos;\s*\)/g, ": '' )"],
    
    // Fix array elements with broken quotes
    [/\[&apos;([^&]*)&apos;\]/g, "['$1']"],
    
    // Fix object property assignments
    [/=\s*&apos;&apos;/g, "= ''"],
    [/=\s*&apos;([^&]*)&apos;/g, "= '$1'"],
    
    // Fix function parameter defaults
    [/=\s*&apos;&apos;\)/g, "= '')"],
    [/=\s*&apos;([^&]*)&apos;\)/g, "= '$1')"],
    
    // Fix variable assignments
    [/const\s+\w+\s*=\s*&apos;&apos;/g, (match) => match.replace(/&apos;&apos;/, "''")],
    [/let\s+\w+\s*=\s*&apos;&apos;/g, (match) => match.replace(/&apos;&apos;/, "''")],
    [/var\s+\w+\s*=\s*&apos;&apos;/g, (match) => match.replace(/&apos;&apos;/, "''")],
    
    // Fix return statements
    [/return\s*&apos;&apos;/g, "return ''"],
    [/return\s*&apos;([^&]*)&apos;/g, "return '$1'"],
    
    // Fix template literal expressions
    [/\$\{&apos;([^&]*)&apos;\}/g, "${'$1'}"],
    
    // Fix conditional expressions
    [/\?\s*&apos;&apos;/g, "? ''"],
    [/\?\s*&apos;([^&]*)&apos;/g, "? '$1'"],
    [/:\s*&apos;&apos;/g, ": ''"],
    
    // Fix any remaining broken quotes in strings
    [/&apos;([^&]*?)&apos;/g, "'$1'"],
  ];

  fixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed all broken strings in: ${filePath}`);
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

console.log(`Fixed all broken strings in ${fixedCount} files.`);
