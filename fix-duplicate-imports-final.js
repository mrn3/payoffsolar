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

// Function to fix duplicate imports
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Find all react-icons/fa imports
  const lines = content.split('\n');
  const reactIconsImports = [];
  const otherLines = [];
  
  lines.forEach((line, index) => {
    if (line.includes('react-icons/fa')) {
      // Extract icons from this import
      const match = line.match(/import \{ ([^}]*) \} from ['"]react-icons\/fa['"];?/);
      if (match) {
        const icons = match[1].split(',').map(icon => icon.trim()).filter(icon => icon);
        reactIconsImports.push(...icons);
      }
    } else {
      otherLines.push(line);
    }
  });

  // If we found multiple react-icons imports, merge them
  if (reactIconsImports.length > 0) {
    // Remove duplicates and sort
    const uniqueIcons = [...new Set(reactIconsImports)].sort();
    
    // Create new merged import
    const mergedImport = `import { ${uniqueIcons.join(', ')} } from 'react-icons/fa';`;
    
    // Find the best place to insert the import (after other imports)
    let insertIndex = 0;
    for (let i = 0; i < otherLines.length; i++) {
      if (otherLines[i].startsWith('import ')) {
        insertIndex = i + 1;
      } else if (otherLines[i].trim() === '' && insertIndex > 0) {
        // Found empty line after imports
        break;
      } else if (!otherLines[i].startsWith('import ') && !otherLines[i].startsWith('//') && otherLines[i].trim() !== '' && insertIndex > 0) {
        // Found non-import, non-comment line
        break;
      }
    }
    
    // Insert the merged import
    otherLines.splice(insertIndex, 0, mergedImport);
    
    const newContent = otherLines.join('\n');
    
    // Only write if content actually changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed duplicate imports in: ${filePath}`);
      modified = true;
    }
  }

  return modified;
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

console.log(`Fixed duplicate imports in ${fixedCount} files.`);
