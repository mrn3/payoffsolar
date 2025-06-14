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

// Function to revert incorrect entity replacements in JavaScript strings
function revertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Revert HTML entities back to quotes in JavaScript strings
  // Look for patterns like: 'string&apos;string' or "string&quot;string"
  const patterns = [
    // Single quotes in string literals
    /(['"])([^'"]*?)&apos;([^'"]*?)\1/g,
    // Double quotes in string literals  
    /(['"])([^'"]*?)&quot;([^'"]*?)\1/g,
    // Array/object property access with entities
    /\[&apos;([^&]+?)&apos;\]/g,
    /\[&quot;([^&]+?)&quot;\]/g,
  ];

  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, (match, quote, before, after) => {
        if (pattern.source.includes('&apos;')) {
          if (pattern.source.includes('\\[')) {
            // Array access pattern
            return `['${before}']`;
          } else {
            // String literal pattern
            return `${quote}${before}'${after}${quote}`;
          }
        } else if (pattern.source.includes('&quot;')) {
          if (pattern.source.includes('\\[')) {
            // Array access pattern
            return `["${before}"]`;
          } else {
            // String literal pattern
            return `${quote}${before}"${after}${quote}`;
          }
        }
        return match;
      });
      modified = true;
    }
  });

  // Also handle simple cases where entire strings were converted
  content = content.replace(/&apos;&apos;/g, "''");
  content = content.replace(/&quot;&quot;/g, '""');
  
  // Fix specific patterns that were incorrectly converted
  content = content.replace(/message: &apos;([^&]+?)&apos;/g, "message: '$1'");
  content = content.replace(/path: \[&apos;([^&]+?)&apos;\]/g, "path: ['$1']");
  content = content.replace(/title: &apos;&apos;/g, "title: ''");
  content = content.replace(/slug: &apos;&apos;/g, "slug: ''");
  content = content.replace(/content: &apos;&apos;/g, "content: ''");
  content = content.replace(/type_id: &apos;&apos;/g, "type_id: ''");
  content = content.replace(/email: &apos;&apos;/g, "email: ''");
  content = content.replace(/password: &apos;&apos;/g, "password: ''");

  if (content.includes('&apos;') || content.includes('&quot;')) {
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Reverted: ${filePath}`);
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
  if (revertFile(file)) {
    fixedCount++;
  }
});

console.log(`Reverted ${fixedCount} files.`);
