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

// Function to fix syntax errors
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix malformed HTML entities that break syntax
  const malformedEntityFixes = [
    // Fix incomplete entities at end of strings/attributes
    [/&apos;(?=[^a-zA-Z0-9]|$)/g, "'"],
    [/&quot;(?=[^a-zA-Z0-9]|$)/g, '"'],
    
    // Fix entities in template literals and className attributes
    [/className="([^"]*?)&apos;([^"]*?)"/g, 'className="$1\'$2"'],
    [/className="([^"]*?)&quot;([^"]*?)"/g, 'className="$1"$2"'],
    
    // Fix entities in JSX expressions
    [/\{[^}]*&apos;[^}]*\}/g, (match) => match.replace(/&apos;/g, "'")],
    [/\{[^}]*&quot;[^}]*\}/g, (match) => match.replace(/&quot;/g, '"')],
    
    // Fix specific patterns that cause syntax errors
    [/'bg-white bg-opacity-50&apos;/g, "'bg-white bg-opacity-50'"],
    [/'flex&apos;/g, "'flex'"],
    [/'Other Products&apos;/g, "'Other Products'"],
    
    // Fix router.push calls with malformed entities
    [/router\.push\('([^']*?)&apos;([^']*?)'\)/g, "router.push('$1'$2')"],
    [/onClick=\{[^}]*router\.push\('([^']*?)&apos;([^']*?)'\)[^}]*\}/g, "onClick={() => router.push('$1'$2')}"],
    
    // Fix any remaining standalone entities that shouldn't be there
    [/([a-zA-Z0-9])&apos;([^a-zA-Z])/g, "$1'$2"],
    [/([a-zA-Z0-9])&quot;([^a-zA-Z])/g, '$1"$2'],
  ];

  malformedEntityFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix specific useEffect dependency issues
  const useEffectFixes = [
    // Add missing dependencies to useEffect
    [/useEffect\(\(\) => \{[^}]*fetchContent\([^}]*\}, \[params\.id\]\);/g, 
     'useEffect(() => { if (params.id) { fetchContent(params.id as string); } }, [params.id, fetchContent]);'],
    [/useEffect\(\(\) => \{[^}]*fetchProduct[^}]*fetchProductImages[^}]*\}, \[params\.id\]\);/g,
     'useEffect(() => { if (params.id) { fetchProduct(params.id as string); fetchProductImages(params.id as string); } }, [params.id, fetchProduct, fetchProductImages]);'],
  ];

  useEffectFixes.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  // Fix remaining unused variable issues
  const unusedVarFixes = [
    // Fix unused imports
    [/import \{ ([^}]*), (format|isAdmin|FaWarehouse|FaEdit|FaClock|FaSpinner|FaSearch|FaExchangeAlt|FaTrash|Image|ProductCategory)([^}]*) \}/g, 
     'import { $1$3 }'],
    [/import \{ (format|isAdmin|FaWarehouse|FaEdit|FaClock|FaSpinner|FaSearch|FaExchangeAlt|FaTrash|Image|ProductCategory), ([^}]*) \}/g, 
     'import { $2 }'],
    [/import \{ (format|isAdmin|FaWarehouse|FaEdit|FaClock|FaSpinner|FaSearch|FaExchangeAlt|FaTrash|Image|ProductCategory) \}/g, ''],
  ];

  unusedVarFixes.forEach(([pattern, replacement]) => {
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
