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

// Function to fix missing icon imports
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Find all used React icons in the file
  const usedIcons = [];
  const iconPatterns = [
    /FaEdit/g, /FaTrash/g, /FaSearch/g, /FaSpinner/g, /FaClock/g,
    /FaExchangeAlt/g, /FaWarehouse/g, /FaUploadAlt/g, /FaCopy/g,
    /FaTrashAlt/g, /FaUpload/g, /FaTimes/g, /FaCopyAlt/g,
    /FaCheck/g, /FaExclamationTriangle/g, /FaCheckCircle/g,
    /FaArrowLeft/g, /FaGlobe/g, /FaPlus/g, /FaEye/g, /FaImage/g,
    /FaFileImport/g, /FaFileExport/g, /FaShoppingCart/g
  ];

  iconPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const iconName = pattern.source.replace(/\//g, '');
      if (!usedIcons.includes(iconName)) {
        usedIcons.push(iconName);
      }
    }
  });

  if (usedIcons.length === 0) {
    return false;
  }

  // Check current react-icons imports
  const reactIconsImportMatch = content.match(/import \{ ([^}]*) \} from 'react-icons\/fa';/);
  
  if (reactIconsImportMatch) {
    // Update existing import
    const currentIcons = reactIconsImportMatch[1]
      .split(',')
      .map(icon => icon.trim())
      .filter(icon => icon && !icon.startsWith('_'));
    
    const missingIcons = usedIcons.filter(icon => !currentIcons.includes(icon));
    
    if (missingIcons.length > 0) {
      const allIcons = [...new Set([...currentIcons, ...missingIcons])].sort();
      const newImport = `import { ${allIcons.join(', ')} } from 'react-icons/fa';`;
      content = content.replace(reactIconsImportMatch[0], newImport);
      modified = true;
    }
  } else {
    // Add new import
    const importStatement = `import { ${usedIcons.sort().join(', ')} } from 'react-icons/fa';`;
    
    // Find the best place to insert the import
    const importLines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].startsWith('import ')) {
        insertIndex = i + 1;
      } else if (importLines[i].trim() === '' && insertIndex > 0) {
        // Found empty line after imports
        break;
      } else if (!importLines[i].startsWith('import ') && !importLines[i].startsWith('//') && importLines[i].trim() !== '' && insertIndex > 0) {
        // Found non-import, non-comment line
        break;
      }
    }
    
    importLines.splice(insertIndex, 0, importStatement);
    content = importLines.join('\n');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed icons in: ${filePath}`);
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

console.log(`Fixed icons in ${fixedCount} files.`);
