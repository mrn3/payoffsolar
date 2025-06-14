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

// Function to extract used React icons from file content
function extractUsedIcons(content) {
  const iconPattern = /<(Fa[A-Z][a-zA-Z]*)/g;
  const icons = new Set();
  let match;
  
  while ((match = iconPattern.exec(content)) !== null) {
    icons.add(match[1]);
  }
  
  return Array.from(icons);
}

// Function to fix React icon imports
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Skip if file doesn't contain React icons
  if (!content.includes('<Fa')) {
    return false;
  }

  const usedIcons = extractUsedIcons(content);
  
  if (usedIcons.length === 0) {
    return false;
  }

  // Check if react-icons import already exists
  const hasReactIconsImport = /import.*from ['"]react-icons\/fa['"]/.test(content);
  
  if (!hasReactIconsImport) {
    // Find the last import statement
    const importLines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      // Add the react-icons import after the last import
      const iconImport = `import { ${usedIcons.join(', ')} } from 'react-icons/fa';`;
      importLines.splice(lastImportIndex + 1, 0, iconImport);
      content = importLines.join('\n');
      modified = true;
    }
  } else {
    // Update existing import to include all used icons
    content = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*['"]react-icons\/fa['"];?/,
      (match, existingIcons) => {
        const existing = existingIcons.split(',').map(icon => icon.trim()).filter(Boolean);
        const allIcons = [...new Set([...existing, ...usedIcons])].sort();
        return `import { ${allIcons.join(', ')} } from 'react-icons/fa';`;
      }
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed React icon imports in: ${filePath}`);
    console.log(`  Added icons: ${usedIcons.join(', ')}`);
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

console.log(`Fixed React icon imports in ${fixedCount} files.`);
