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

// Function to fix remaining syntax errors
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix malformed HTML entities in className attributes
  const entityFixes = [
    [/className="([^"]*?)&quot;/g, 'className="$1"'],
    [/className="([^"]*?)&apos;/g, 'className="$1"'],
    [/&quot;([^"]*?)"/g, '"$1"'],
    [/&apos;([^']*?)'/g, "'$1'"],
    [/onClick=\{[^}]*&apos;[^}]*\}/g, (match) => {
      return match.replace(/&apos;/g, "''");
    }],
    [/onClick=\{[^}]*&quot;[^}]*\}/g, (match) => {
      return match.replace(/&quot;/g, '""');
    }],
  ];

  entityFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix missing imports for common functions
  const missingImportFixes = [
    // Add isAdmin import if used but not imported
    {
      pattern: /isAdmin\(/,
      importPattern: /import.*isAdmin.*from/,
      fix: (content) => {
        if (!content.match(/import.*isAdmin.*from/)) {
          return content.replace(
            /import \{([^}]*)\} from '@\/lib\/auth';/,
            'import {$1, isAdmin} from \'@/lib/auth\';'
          );
        }
        return content;
      }
    },
    // Add useCallback import if used but not imported
    {
      pattern: /useCallback\(/,
      importPattern: /import.*useCallback.*from/,
      fix: (content) => {
        if (!content.match(/import.*useCallback.*from/)) {
          return content.replace(
            /import \{([^}]*)\} from 'react';/,
            'import {$1, useCallback} from \'react\';'
          );
        }
        return content;
      }
    }
  ];

  missingImportFixes.forEach(({ pattern, importPattern, fix }) => {
    if (pattern.test(content) && !importPattern.test(content)) {
      const newContent = fix(content);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });

  // Fix missing variable declarations
  const variableFixes = [
    // Add missing data variable in fetch functions
    [/const response = await fetch\([^;]*;\s*if \(response\.ok\) \{\s*setContent\(data\.content\);/g, 
     'const response = await fetch($1;\n      if (response.ok) {\n        const data = await response.json();\n        setContent(data.content);'],
    [/const response = await fetch\([^;]*;\s*if \(response\.ok\) \{\s*setContentTypes\(data\.contentTypes\);/g, 
     'const response = await fetch($1;\n      if (response.ok) {\n        const data = await response.json();\n        setContentTypes(data.contentTypes);'],
  ];

  variableFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix useEffect dependencies
  const useEffectFixes = [
    [/useEffect\(\(\) => \{\s*fetchContent\(\);\s*\}, \[\]\);/g, 'useEffect(() => {\n    fetchContent();\n  }, [fetchContent]);'],
    [/useEffect\(\(\) => \{\s*fetchContentTypes\(\);\s*fetchContent\(\);\s*\}, \[\]\);/g, 'useEffect(() => {\n    fetchContentTypes();\n    fetchContent();\n  }, [fetchContent]);'],
  ];

  useEffectFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed syntax errors in: ${filePath}`);
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

console.log(`Fixed syntax errors in ${fixedCount} files.`);
