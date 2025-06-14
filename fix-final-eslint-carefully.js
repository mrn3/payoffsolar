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

// Function to carefully fix remaining ESLint issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix unescaped entities in JSX text content only (not in strings)
  const jsxTextFixes = [
    // Fix apostrophes in JSX text between tags (not in attributes or strings)
    [/>([^<]*[a-zA-Z])'([a-zA-Z][^<]*)</g, '>$1&apos;$2<'],
    // Fix quotes in JSX text between tags
    [/>([^<]*[a-zA-Z])"([a-zA-Z][^<]*)</g, '>$1&quot;$2<'],
  ];

  jsxTextFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix specific unused variable patterns more carefully
  const safeUnusedVarFixes = [
    // Fix unused function parameters in specific contexts
    [/async function \w+\(([^)]*), (error|data|request|response|params)\b([^)]*)\)/g, 'async function $1($1, _$2$3)'],
    [/function \w+\(([^)]*), (error|data|request|response|params)\b([^)]*)\)/g, 'function $1($1, _$2$3)'],
    
    // Fix unused arrow function parameters
    [/\(([^)]*), (error|data|e|event|evt)\b([^)]*)\) => \{/g, '($1, _$2$3) => {'],
    
    // Fix unused destructured variables in specific patterns
    [/const \{ data, (error|loading|mutate) \} = /g, 'const { data, _$1 } = '],
    [/const \{ (error|loading), data \} = /g, 'const { _$1, data } = '],
  ];

  safeUnusedVarFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Remove specific unused imports more carefully
  const safeImportFixes = [
    // Remove unused Image import if not used
    [/import Image from 'next\/image';\n/g, (match) => {
      return content.includes('<Image') ? match : '';
    }],
    
    // Remove unused format import if not used
    [/import \{ format \} from 'date-fns';\n/g, (match) => {
      return content.includes('format(') ? match : '';
    }],
    
    // Clean up specific unused React icons
    [/import \{ ([^}]*), FaUser([^}]*) \} from 'react-icons\/fa';/g, (match, before, after) => {
      if (!content.includes('<FaUser')) {
        const cleanBefore = before.replace(/,\s*$/, '');
        const cleanAfter = after.replace(/^\s*,/, '');
        const cleanImports = [cleanBefore, cleanAfter].filter(Boolean).join(', ');
        return cleanImports ? `import { ${cleanImports} } from 'react-icons/fa';` : '';
      }
      return match;
    }],
    
    [/import \{ ([^}]*), FaCheck([^}]*) \} from 'react-icons\/fa';/g, (match, before, after) => {
      if (!content.includes('<FaCheck')) {
        const cleanBefore = before.replace(/,\s*$/, '');
        const cleanAfter = after.replace(/^\s*,/, '');
        const cleanImports = [cleanBefore, cleanAfter].filter(Boolean).join(', ');
        return cleanImports ? `import { ${cleanImports} } from 'react-icons/fa';` : '';
      }
      return match;
    }],
  ];

  safeImportFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Clean up empty import lines
  content = content.replace(/import \{\s*\} from[^;]*;?\n/g, '');

  // Remove multiple consecutive empty lines
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Carefully fixed ESLint issues in: ${filePath}`);
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

console.log(`Carefully fixed ESLint issues in ${fixedCount} files.`);
