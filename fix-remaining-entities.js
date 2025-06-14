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

// Function to fix remaining entity issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix specific patterns that are still problematic
  const fixes = [
    // Fix string literals with entities
    [/&apos;([^&]*?)&apos;/g, "'$1'"],
    [/&quot;([^&]*?)&quot;/g, '"$1"'],
    
    // Fix specific error messages and strings
    [/newErrors\.name = &apos;([^&]*?)&apos;/g, "newErrors.name = '$1'"],
    [/newErrors\.email = &apos;([^&]*?)&apos;/g, "newErrors.email = '$1'"],
    [/newErrors\.phone = &apos;([^&]*?)&apos;/g, "newErrors.phone = '$1'"],
    
    // Fix fetch URLs and other string literals
    [/fetch\(&apos;([^&]*?)&apos;/g, "fetch('$1'"],
    [/router\.push\(&apos;([^&]*?)&apos;\)/g, "router.push('$1')"],
    [/throw new Error\([^)]*&apos;([^&]*?)&apos;[^)]*/g, "throw new Error('$1'"],
    [/err instanceof Error \? err\.message : &apos;([^&]*?)&apos;/g, "err instanceof Error ? err.message : '$1'"],
    
    // Fix className strings
    [/className=&quot;([^&]*?)&quot;/g, 'className="$1"'],
    [/onClick=\{[^}]*router\.push\(&apos;([^&]*?)&apos;\)[^}]*\}/g, "onClick={() => router.push('$1')}"],
    
    // Fix JSX text content that should have entities
    [/>([^<{]*)'([^<{]*)</g, '>$1&apos;$2<'],
    [/>([^<{]*)"([^<{]*)</g, '>$1&quot;$2<'],
  ];

  fixes.forEach(([pattern, replacement]) => {
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
