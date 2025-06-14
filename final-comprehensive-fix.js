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

// Function to fix all remaining issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix prefixed icons that are still being used
  const iconFixes = [
    [/_FaEdit/g, 'FaEdit'],
    [/_FaTrash/g, 'FaTrash'],
    [/_FaSearch/g, 'FaSearch'],
    [/_FaSpinner/g, 'FaSpinner'],
    [/_FaClock/g, 'FaClock'],
    [/_FaExchangeAlt/g, 'FaExchangeAlt'],
    [/_FaWarehouse/g, 'FaWarehouse'],
    [/_FaUploadAlt/g, 'FaUploadAlt'],
  ];

  iconFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix router variables that are actually used
  if (content.includes('router.push') || content.includes('router.replace')) {
    content = content.replace(/const _router = useRouter\(\);/g, 'const router = useRouter();');
    content = content.replace(/let _router = useRouter\(\);/g, 'let router = useRouter();');
    modified = true;
  }

  // Fix other variables that are actually used
  const variableFixes = [
    // Fix formatPrice if it's used
    [/const _formatPrice = /g, (match) => {
      if (content.includes('formatPrice(') || content.includes('${formatPrice')) {
        return 'const formatPrice = ';
      }
      return match;
    }],
    // Fix format if it's used
    [/const _format = /g, (match) => {
      if (content.includes('format(')) {
        return 'const format = ';
      }
      return match;
    }],
    // Fix isAdmin if it's used
    [/const _isAdmin = /g, (match) => {
      if (content.includes('isAdmin')) {
        return 'const isAdmin = ';
      }
      return match;
    }],
  ];

  variableFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix missing icon imports
  const usedIcons = [];
  const iconPatterns = [
    /FaEdit/g, /FaTrash/g, /FaSearch/g, /FaSpinner/g, /FaClock/g,
    /FaExchangeAlt/g, /FaWarehouse/g, /FaUploadAlt/g, /FaCopy/g,
    /FaTrashAlt/g, /FaUpload/g, /FaTimes/g, /FaCopyAlt/g
  ];

  iconPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      const iconName = pattern.source.replace(/\//g, '');
      if (!usedIcons.includes(iconName)) {
        usedIcons.push(iconName);
      }
    }
  });

  // Check if icons are imported
  const reactIconsImport = content.match(/import \{ ([^}]*) \} from 'react-icons\/fa';/);
  if (reactIconsImport && usedIcons.length > 0) {
    const currentIcons = reactIconsImport[1].split(',').map(icon => icon.trim());
    const missingIcons = usedIcons.filter(icon => !currentIcons.includes(icon));
    
    if (missingIcons.length > 0) {
      const newIcons = [...currentIcons, ...missingIcons].join(', ');
      content = content.replace(reactIconsImport[0], `import { ${newIcons} } from 'react-icons/fa';`);
      modified = true;
    }
  }

  // Fix useCallback dependencies
  content = content.replace(/\}, \[router\]\);/g, '}, []);');
  
  // Fix useEffect dependencies for functions that don't need to be dependencies
  content = content.replace(/\}, \[([^,\]]*), fetchContent\]\);/g, '}, [$1]);');
  content = content.replace(/\}, \[fetchContent\]\);/g, '}, []);');

  // Remove unused imports completely
  const unusedImportFixes = [
    [/import \{ ([^}]*), (Image|ProductCategory|isValidPhoneNumber)([^}]*) \} from/g, 'import {$1$3} from'],
    [/import \{ (Image|ProductCategory|isValidPhoneNumber), ([^}]*) \} from/g, 'import {$2} from'],
    [/import \{ (Image|ProductCategory|isValidPhoneNumber) \} from[^;]*;?\n?/g, ''],
  ];

  unusedImportFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Clean up empty imports
  content = content.replace(/import \{ \} from[^;]*;?\n?/g, '');
  content = content.replace(/import \{  \} from[^;]*;?\n?/g, '');

  // Fix any remaining type issues
  content = content.replace(/: any\b/g, ': unknown');

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
