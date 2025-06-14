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

// Function to fix duplicate useEffect closing brackets
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix duplicate useEffect closing brackets
  const duplicateUseEffectPattern = /\}, \[\]\) \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\s*\}, \[\];/g;
  
  if (duplicateUseEffectPattern.test(content)) {
    content = content.replace(duplicateUseEffectPattern, '}, []); // eslint-disable-next-line react-hooks/exhaustive-deps');
    modified = true;
  }

  // Also fix any remaining patterns like this
  const anotherPattern = /\}, \[\]\) \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\s*\}, \[\]/g;
  
  if (anotherPattern.test(content)) {
    content = content.replace(anotherPattern, '}, []); // eslint-disable-next-line react-hooks/exhaustive-deps');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed duplicate useEffect in: ${filePath}`);
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

console.log(`Fixed duplicate useEffect in ${fixedCount} files.`);
