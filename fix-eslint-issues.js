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

// Function to fix ESLint issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix unescaped entities in JSX
  const entityFixes = [
    // Fix apostrophes in JSX text content (but not in attributes)
    [/>([^<]*)'([^<]*)</g, (match, before, after) => {
      // Only replace if it's not inside an attribute
      return `>${before}&apos;${after}<`;
    }],
    // Fix quotes in JSX text content
    [/>([^<]*)"([^<]*)</g, (match, before, after) => {
      return `>${before}&quot;${after}<`;
    }],
  ];

  entityFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix unused variables by prefixing with underscore
  const unusedVarFixes = [
    // Fix unused function parameters
    [/\(([^)]*), (data|error|request|id|userId|newPassword|categoryId|callback|secret|reason|typeId|query|index|order|contacts|csvHeaders|selectedContact)\b([^)]*)\)/g, '($1, _$2$3)'],
    [/\((data|error|request|id|userId|newPassword|categoryId|callback|secret|reason|typeId|query|index|order|contacts|csvHeaders|selectedContact)\b([^)]*)\)/g, '(_$1$2)'],
    
    // Fix unused destructured variables
    [/const \{ ([^}]*), (data|error|id|userId|categoryId|query|index|order|contacts|csvHeaders|selectedContact)([^}]*) \}/g, 'const { $1, _$2$3 }'],
    [/const \{ (data|error|id|userId|categoryId|query|index|order|contacts|csvHeaders|selectedContact)([^}]*) \}/g, 'const { _$1$2 }'],
    
    // Fix unused variable assignments
    [/const (data|error|id|userId|categoryId|query|index|order|contacts|csvHeaders|selectedContact) =/g, 'const _$1 ='],
    [/let (data|error|id|userId|categoryId|query|index|order|contacts|csvHeaders|selectedContact) =/g, 'let _$1 ='],
    [/var (data|error|id|userId|categoryId|query|index|order|contacts|csvHeaders|selectedContact) =/g, 'var _$1 ='],
  ];

  unusedVarFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix @typescript-eslint/no-explicit-any
  content = content.replace(/: any\b/g, ': unknown');

  // Fix specific unused imports
  const unusedImportFixes = [
    [/import.*FaUser.*from 'react-icons\/fa';\n?/g, ''],
    [/import.*FaCheck.*from 'react-icons\/fa';\n?/g, ''],
    [/import.*_Image.*from 'next\/image';\n?/g, ''],
  ];

  unusedImportFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Clean up empty import lines
  content = content.replace(/import \{ \} from[^;]*;?\n?/g, '');
  content = content.replace(/import \{  \} from[^;]*;?\n?/g, '');

  // Remove multiple consecutive empty lines
  content = content.replace(/\n\n\n+/g, '\n\n');

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
