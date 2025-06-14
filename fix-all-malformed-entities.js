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

// Function to fix all malformed entities
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix all malformed HTML entities that break JSX parsing
  const malformedEntityFixes = [
    // Fix incomplete entities at the end of attributes
    [/&apos;(?=\s*[>\}\)\]\,\;\s])/g, "'"],
    [/&quot;(?=\s*[>\}\)\]\,\;\s])/g, '"'],
    
    // Fix entities in className attributes
    [/className="([^"]*?)&apos;([^"]*?)"/g, 'className="$1\'$2"'],
    [/className="([^"]*?)&quot;([^"]*?)"/g, 'className="$1"$2"'],
    
    // Fix entities in other attributes
    [/(\w+)="([^"]*?)&apos;([^"]*?)"/g, '$1="$2\'$3"'],
    [/(\w+)="([^"]*?)&quot;([^"]*?)"/g, '$1="$2"$3"'],
    
    // Fix entities in JSX expressions
    [/\{[^}]*&apos;[^}]*\}/g, (match) => match.replace(/&apos;/g, "'")],
    [/\{[^}]*&quot;[^}]*\}/g, (match) => match.replace(/&quot;/g, '"')],
    
    // Fix entities in function calls
    [/\([^)]*&apos;[^)]*\)/g, (match) => match.replace(/&apos;/g, "'")],
    [/\([^)]*&quot;[^)]*\)/g, (match) => match.replace(/&quot;/g, '"')],
    
    // Fix specific problematic patterns
    [/'99\+&apos;/g, "'99+'"],
    [/&apos;\s*:/g, "':"],
    [/&quot;\s*:/g, '":'],
    [/&apos;\s*\}/g, "'}"],
    [/&quot;\s*\}/g, '"}'],
    [/&apos;\s*\)/g, "')"],
    [/&quot;\s*\)/g, '")'],
    [/&apos;\s*\]/g, "']"],
    [/&quot;\s*\]/g, '"]'],
    [/&apos;\s*,/g, "',"],
    [/&quot;\s*,/g, '",'],
    [/&apos;\s*;/g, "';"],
    [/&quot;\s*;/g, '";'],
    [/&apos;\s*>/g, "'>"],
    [/&quot;\s*>/g, '">'],
    
    // Fix entities at the end of lines
    [/&apos;\s*$/gm, "'"],
    [/&quot;\s*$/gm, '"'],
    
    // Fix any remaining standalone entities that shouldn't be there
    [/([a-zA-Z0-9_-])&apos;([^a-zA-Z])/g, "$1'$2"],
    [/([a-zA-Z0-9_-])&quot;([^a-zA-Z])/g, '$1"$2'],
  ];

  malformedEntityFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Ensure proper JSX text entities (only in actual text content between tags)
  const jsxTextFixes = [
    // Fix text content between JSX tags that contains quotes
    [/>([^<{]*)'([^<{]*)</g, (match, before, after) => {
      // Only replace if this is actual text content, not an attribute or expression
      if (!before.includes('=') && !after.includes('=') && !before.includes('{') && !after.includes('}')) {
        return `>${before}&apos;${after}<`;
      }
      return match;
    }],
    [/>([^<{]*)"([^<{]*)</g, (match, before, after) => {
      // Only replace if this is actual text content, not an attribute or expression
      if (!before.includes('=') && !after.includes('=') && !before.includes('{') && !after.includes('}')) {
        return `>${before}&quot;${after}<`;
      }
      return match;
    }],
  ];

  jsxTextFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
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

console.log(`Fixed ${fixedCount} files.`);
