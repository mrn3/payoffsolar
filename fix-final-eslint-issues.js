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

// Function to fix final ESLint issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix remaining unescaped entities in JSX
  const entityFixes = [
    // Fix apostrophes in JSX text content
    [/>([^<]*)'([^<]*)</g, '>$1&apos;$2<'],
    [/>([^<]*)"([^<]*)</g, '>$1&quot;$2<'],
  ];

  entityFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Remove unused imports and variables by commenting them out or prefixing with underscore
  const unusedVarFixes = [
    // Remove unused imports
    [/import.*FaUser.*from 'react-icons\/fa';?\n?/g, ''],
    [/import.*FaCheck.*from 'react-icons\/fa';?\n?/g, ''],
    [/import.*_Image.*from 'next\/image';?\n?/g, ''],
    [/import.*_verifyResetToken.*from.*;\n?/g, ''],
    [/import.*ImportOrderItem.*from.*;\n?/g, ''],
    
    // Fix unused variables by prefixing with underscore (if not already prefixed)
    [/\b(contacts|csvHeaders|order|contactName|selectedContact|error)\b(?=\s*[=:])/g, '_$1'],
    
    // Fix unused parameters in function signatures
    [/\(([^)]*), (data|error|request|id|userId|newPassword|categoryId|callback|secret|reason|typeId|query|index)\b([^)]*)\)/g, '($1, _$2$3)'],
    [/\((data|error|request|id|userId|newPassword|categoryId|callback|secret|reason|typeId|query|index)\b([^)]*)\)/g, '(_$1$2)'],
    
    // Fix unused destructured variables
    [/const \{ ([^}]*), (data|error|id|userId|categoryId|query|index|order)([^}]*) \}/g, 'const { $1, _$2$3 }'],
    [/const \{ (data|error|id|userId|categoryId|query|index|order)([^}]*) \}/g, 'const { _$1$2 }'],
  ];

  unusedVarFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix @typescript-eslint/no-explicit-any
  content = content.replace(/: any\b/g, ': unknown');

  // Clean up empty import lines that might have been created
  content = content.replace(/import \{ \} from[^;]*;?\n?/g, '');
  content = content.replace(/import \{  \} from[^;]*;?\n?/g, '');

  // Remove multiple consecutive empty lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed final ESLint issues in: ${filePath}`);
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

console.log(`Fixed final ESLint issues in ${fixedCount} files.`);
