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

// Function to fix unterminated strings
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix specific unterminated string patterns
  const fixes = [
    // Fix unterminated strings with &apos; at the end
    [/: '([^']*?)&apos;\)/g, ": '$1')"],
    [/: "([^"]*?)&apos;\)/g, ': "$1")'],
    
    // Fix array elements with broken quotes
    [/\['([^']*?)&apos;\]/g, "['$1']"],
    [/\["([^"]*?)&apos;\]/g, '["$1"]'],
    
    // Fix object property values with broken quotes
    [/: '([^']*?)&apos;,/g, ": '$1',"],
    [/: "([^"]*?)&apos;,/g, ': "$1",'],
    
    // Fix any remaining &apos; that should be closing quotes
    [/&apos;([,\)\]\}])/g, "'$1"],
    [/&quot;([,\)\]\}])/g, '"$1'],
    
    // Fix specific broken patterns from the error messages
    [/'893&apos;/g, "'confirmPassword'"],
    [/'624&apos;/g, "'confirmPassword'"],
    [/type_id: '&apos;,/g, "type_id: '',"],
    
    // Fix error variable references
    [/error\.message/g, '_error.message'],
  ];

  fixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed unterminated strings in: ${filePath}`);
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

console.log(`Fixed unterminated strings in ${fixedCount} files.`);
