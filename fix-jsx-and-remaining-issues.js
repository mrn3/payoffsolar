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

// Function to fix JSX and remaining string issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix broken JSX className attributes
  const jsxFixes = [
    // Fix className attributes with broken quotes
    [/className=&quot;([^&]*?)&quot;/g, 'className="$1"'],
    [/className=&apos;([^&]*?)&apos;/g, "className='$1'"],
    
    // Fix other JSX attributes
    [/(\w+)=&quot;([^&]*?)&quot;/g, '$1="$2"'],
    [/(\w+)=&apos;([^&]*?)&apos;/g, "$1='$2'"],
    
    // Fix href attributes
    [/href=&quot;([^&]*?)&quot;/g, 'href="$1"'],
    [/href=&apos;([^&]*?)&apos;/g, "href='$1'"],
    
    // Fix src attributes
    [/src=&quot;([^&]*?)&quot;/g, 'src="$1"'],
    [/src=&apos;([^&]*?)&apos;/g, "src='$1'"],
    
    // Fix alt attributes
    [/alt=&quot;([^&]*?)&quot;/g, 'alt="$1"'],
    [/alt=&apos;([^&]*?)&apos;/g, "alt='$1'"],
    
    // Fix placeholder attributes
    [/placeholder=&quot;([^&]*?)&quot;/g, 'placeholder="$1"'],
    [/placeholder=&apos;([^&]*?)&apos;/g, "placeholder='$1'"],
    
    // Fix value attributes
    [/value=&quot;([^&]*?)&quot;/g, 'value="$1"'],
    [/value=&apos;([^&]*?)&apos;/g, "value='$1'"],
    
    // Fix id attributes
    [/id=&quot;([^&]*?)&quot;/g, 'id="$1"'],
    [/id=&apos;([^&]*?)&apos;/g, "id='$1'"],
    
    // Fix type attributes
    [/type=&quot;([^&]*?)&quot;/g, 'type="$1"'],
    [/type=&apos;([^&]*?)&apos;/g, "type='$1'"],
  ];

  jsxFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix unterminated strings in error messages and other contexts
  const stringFixes = [
    // Fix unterminated strings at end of lines
    [/: '([^']*?)&apos;\)/g, ": '$1')"],
    [/: "([^"]*?)&quot;\)/g, ': "$1")'],
    
    // Fix strings in ternary operators
    [/\? '([^']*?)&apos; :/g, "? '$1' :"],
    [/\? "([^"]*?)&quot; :/g, '? "$1" :'],
    
    // Fix strings in function calls
    [/'([^']*?)&apos;\)/g, "'$1')"],
    [/"([^"]*?)&quot;\)/g, '"$1")'],
    
    // Fix any remaining &apos; and &quot; entities
    [/&apos;/g, "'"],
    [/&quot;/g, '"'],
  ];

  stringFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed JSX and remaining issues in: ${filePath}`);
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

console.log(`Fixed JSX and remaining issues in ${fixedCount} files.`);
