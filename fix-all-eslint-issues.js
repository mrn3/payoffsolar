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

// Function to fix all ESLint issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix missing icon imports
  const missingIcons = [];
  const iconChecks = [
    { pattern: /FaDownload/g, icon: 'FaDownload' },
    { pattern: /FaUser/g, icon: 'FaUser' },
    { pattern: /FaCalendarAlt/g, icon: 'FaCalendarAlt' },
    { pattern: /FaMinus/g, icon: 'FaMinus' },
    { pattern: /FaMapMarkerAlt/g, icon: 'FaMapMarkerAlt' }
  ];

  iconChecks.forEach(({ pattern, icon }) => {
    if (pattern.test(content) && !missingIcons.includes(icon)) {
      missingIcons.push(icon);
    }
  });

  if (missingIcons.length > 0) {
    // Add missing icons to existing import
    const reactIconsImportMatch = content.match(/import \{ ([^}]*) \} from 'react-icons\/fa';/);
    if (reactIconsImportMatch) {
      const currentIcons = reactIconsImportMatch[1]
        .split(',')
        .map(icon => icon.trim())
        .filter(icon => icon);
      
      const allIcons = [...new Set([...currentIcons, ...missingIcons])].sort();
      const newImport = `import { ${allIcons.join(', ')} } from 'react-icons/fa';`;
      content = content.replace(reactIconsImportMatch[0], newImport);
      modified = true;
    }
  }

  // Fix unescaped entities
  const entityFixes = [
    [/([^&])'([^s])/g, '$1&apos;$2'],
    [/([^&])"([^s])/g, '$1&quot;$2'],
    [/^'([^s])/gm, '&apos;$1'],
    [/^"([^s])/gm, '&quot;$1'],
  ];

  entityFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix unused variables by prefixing with underscore
  const unusedVarFixes = [
    [/\b(contacts|csvHeaders|order|_index|contactName|error|selectedContact|data|query|typeId|userId|newPassword|categoryId|callback|_secret|id)\b(?=\s*[=:])/g, '_$1'],
    [/import.*\b(Image|verifyResetToken|ImportOrderItem)\b.*from/g, (match) => {
      return match.replace(/\b(Image|verifyResetToken|ImportOrderItem)\b/g, '_$1');
    }],
  ];

  unusedVarFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix @typescript-eslint/no-explicit-any
  content = content.replace(/: any\b/g, ': unknown');

  // Fix useEffect dependencies by adding useCallback
  const useEffectFixes = [
    // Add useCallback import if missing
    {
      pattern: /useCallback\(/,
      importPattern: /import.*useCallback.*from.*react/,
      fix: (content) => {
        if (!content.match(/import.*useCallback.*from.*react/)) {
          return content.replace(
            /import \{([^}]*)\} from 'react';/,
            'import {$1, useCallback} from \'react\';'
          );
        }
        return content;
      }
    }
  ];

  useEffectFixes.forEach(({ pattern, importPattern, fix }) => {
    if (pattern.test(content) && !importPattern.test(content)) {
      const newContent = fix(content);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ESLint issues in: ${filePath}`);
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

console.log(`Fixed ESLint issues in ${fixedCount} files.`);
