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
  const reactIconsImports = [];
  const importRegex = /import \{ ([^}]*) \} from ['"]react-icons\/fa['"];?/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const icons = match[1].split(',').map(icon => icon.trim()).filter(icon => icon);
    reactIconsImports.push({
      fullMatch: match[0],
      icons: icons,
      index: match.index
    });
  }

  // If we have multiple react-icons/fa imports, merge them
  if (reactIconsImports.length > 1) {
    // Collect all unique icons
    const allIcons = new Set();
    reactIconsImports.forEach(importObj => {
      importObj.icons.forEach(icon => allIcons.add(icon));
    });

    // Create new merged import
    const mergedImport = `import { ${Array.from(allIcons).sort().join(', ')} } from 'react-icons/fa';`;

    // Remove all existing react-icons/fa imports
    reactIconsImports.forEach(importObj => {
      content = content.replace(importObj.fullMatch, '');
    });

    // Add the merged import at the beginning of imports section
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the best place to insert the import
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i;
        break;
      }
    }
    
    lines.splice(insertIndex, 0, mergedImport);
    content = lines.join('\n');
    modified = true;
  }

  // Clean up empty lines that were left behind
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed duplicate imports in: ${filePath}`);
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

console.log(`Fixed duplicate imports in ${fixedCount} files.`);
