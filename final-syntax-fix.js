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

// Function to fix final syntax issues
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix any remaining malformed HTML entities in attributes
  const attributeFixes = [
    // Fix className attributes with malformed entities
    [/className=&quot;([^"]*?)"/g, 'className="$1"'],
    [/className="([^"]*?)&quot;([^"]*?)"/g, 'className="$1"$2"'],
    [/className="([^"]*?)&apos;([^"]*?)"/g, 'className="$1\'$2"'],
    
    // Fix href attributes
    [/href=&quot;([^"]*?)"/g, 'href="$1"'],
    [/href="([^"]*?)&quot;([^"]*?)"/g, 'href="$1"$2"'],
    
    // Fix onClick attributes
    [/onClick=&quot;([^"]*?)"/g, 'onClick="$1"'],
    [/onClick="([^"]*?)&quot;([^"]*?)"/g, 'onClick="$1"$2"'],
    
    // Fix any other attributes
    [/(\w+)=&quot;([^"]*?)"/g, '$1="$2"'],
    [/(\w+)="([^"]*?)&quot;([^"]*?)"/g, '$1="$2"$3"'],
  ];

  attributeFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix JSX text content that should have proper entities
  const jsxTextFixes = [
    // Fix text content between JSX tags that contains quotes
    [/>([^<{]*)"([^<{]*)</g, (match, before, after) => {
      // Only replace if this is actual text content, not an attribute
      if (!before.includes('=') && !after.includes('=')) {
        return `>${before}&quot;${after}<`;
      }
      return match;
    }],
    [/>([^<{]*)'([^<{]*)</g, (match, before, after) => {
      // Only replace if this is actual text content, not an attribute
      if (!before.includes('=') && !after.includes('=')) {
        return `>${before}&apos;${after}<`;
      }
      return match;
    }],
  ];

  jsxTextFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix specific problematic patterns that break compilation
  const compilationFixes = [
    // Fix any remaining standalone entities that break syntax
    [/([a-zA-Z0-9_-])&quot;([^a-zA-Z])/g, '$1"$2'],
    [/([a-zA-Z0-9_-])&apos;([^a-zA-Z])/g, "$1'$2"],
    
    // Fix template literal issues
    [/`([^`]*?)&quot;([^`]*?)`/g, '`$1"$2`'],
    [/`([^`]*?)&apos;([^`]*?)`/g, "`$1'$2`"],
    
    // Fix function call issues
    [/\(([^)]*?)&quot;([^)]*?)\)/g, '($1"$2)'],
    [/\(([^)]*?)&apos;([^)]*?)\)/g, "($1'$2)"],
  ];

  compilationFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix specific useEffect dependency arrays that are missing dependencies
  const useEffectDependencyFixes = [
    // Fix missing fetchContent dependency
    [/useEffect\(\(\) => \{[\s\S]*?fetchContent[\s\S]*?\}, \[([^\]]*?)\]\);/g, (match, deps) => {
      if (!deps.includes('fetchContent')) {
        const newDeps = deps ? `${deps}, fetchContent` : 'fetchContent';
        return match.replace(`[${deps}]`, `[${newDeps}]`);
      }
      return match;
    }],
    
    // Fix missing fetchProduct/fetchProductImages dependencies
    [/useEffect\(\(\) => \{[\s\S]*?fetchProduct[\s\S]*?fetchProductImages[\s\S]*?\}, \[([^\]]*?)\]\);/g, (match, deps) => {
      let newDeps = deps;
      if (!deps.includes('fetchProduct')) {
        newDeps = newDeps ? `${newDeps}, fetchProduct` : 'fetchProduct';
      }
      if (!deps.includes('fetchProductImages')) {
        newDeps = newDeps ? `${newDeps}, fetchProductImages` : 'fetchProductImages';
      }
      if (newDeps !== deps) {
        return match.replace(`[${deps}]`, `[${newDeps}]`);
      }
      return match;
    }],
  ];

  useEffectDependencyFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

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
