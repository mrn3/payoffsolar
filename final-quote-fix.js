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

// Function to fix all remaining broken quotes
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix all remaining broken quotes and entities
  const fixes = [
    // Fix any remaining &apos; and &quot; entities
    [/&apos;/g, "'"],
    [/&quot;/g, '"'],
    
    // Fix broken string patterns in various contexts
    [/: '([^']*?)&apos;/g, ": '$1'"],
    [/: "([^"]*?)&quot;/g, ': "$1"'],
    [/'([^']*?)&apos;/g, "'$1'"],
    [/"([^"]*?)&quot;/g, '"$1"'],
    
    // Fix broken array elements
    [/\['([^']*?)&apos;\]/g, "['$1']"],
    [/\["([^"]*?)&quot;\]/g, '["$1"]'],
    
    // Fix broken object properties
    [/(\w+): '([^']*?)&apos;/g, "$1: '$2'"],
    [/(\w+): "([^"]*?)&quot;/g, '$1: "$2"'],
    
    // Fix broken function calls
    [/\('([^']*?)&apos;\)/g, "('$1')"],
    [/\("([^"]*?)&quot;\)/g, '("$1")'],
    
    // Fix broken ternary operators
    [/\? '([^']*?)&apos; :/g, "? '$1' :"],
    [/\? "([^"]*?)&quot; :/g, '? "$1" :'],
    [/: '([^']*?)&apos; \}/g, ": '$1' }"],
    [/: "([^"]*?)&quot; \}/g, ': "$1" }'],
    
    // Fix broken JSX text content
    [/>\s*([^<]*?)&apos;([^<]*?)\s*</g, '>$1\'$2<'],
    [/>\s*([^<]*?)&quot;([^<]*?)\s*</g, '>$1"$2<'],
    
    // Fix broken template literals
    [/`([^`]*?)&apos;([^`]*?)`/g, "`$1'$2`"],
    [/`([^`]*?)&quot;([^`]*?)`/g, '`$1"$2`'],
    
    // Fix specific broken patterns we've seen
    [/'([^']*?)&apos;\)/g, "'$1')"],
    [/"([^"]*?)&quot;\)/g, '"$1")'],
    [/'([^']*?)&apos;,/g, "'$1',"],
    [/"([^"]*?)&quot;,/g, '"$1",'],
    [/'([^']*?)&apos;;/g, "'$1';"],
    [/"([^"]*?)&quot;;/g, '"$1";'],
    [/'([^']*?)&apos;\}/g, "'$1'}"],
    [/"([^"]*?)&quot;\}/g, '"$1"}'],
  ];

  fixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed final quotes in: ${filePath}`);
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

console.log(`Fixed final quotes in ${fixedCount} files.`);
