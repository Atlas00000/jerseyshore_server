/**
 * Post-build script to fix ES module imports
 * Adds .js extensions to relative imports in compiled JavaScript files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix imports with single quotes: from './path' -> from './path.js'
  // Match: from './something' or from '../something' but not if it already ends with .js, .json, etc.
  content = content.replace(
    /from\s+'(\.\.?\/[^']+?)'/g,
    (match, importPath) => {
      // If it already has a file extension, don't modify
      if (/\.(js|json|ts|d\.ts|map|node|mjs|cjs)$/.test(importPath)) {
        return match;
      }
      // Add .js extension
      console.log(`  Replacing: ${match} -> from '${importPath}.js'`);
      return `from '${importPath}.js'`;
    }
  );

  // Fix imports with double quotes: from "./path" -> from "./path.js"
  content = content.replace(
    /from\s+"(\.\.?\/[^"]+?)"/g,
    (match, importPath) => {
      // If it already has a file extension, don't modify
      if (/\.(js|json|ts|d\.ts|map|node|mjs|cjs)$/.test(importPath)) {
        return match;
      }
      // Add .js extension
      return `from "${importPath}.js"`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed imports in: ${path.relative(distDir, filePath)}`);
    return true;
  }
  
  return false;
}

function walkDir(dir) {
  let fixedCount = 0;
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          fixedCount += walkDir(filePath);
        } else if (file.endsWith('.js') && !file.includes('.d.ts') && !file.endsWith('.map.js')) {
          if (fixImportsInFile(filePath)) {
            fixedCount++;
          }
        }
      } catch (err) {
        // Skip files we can't access
        console.warn(`Warning: Could not process ${filePath}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
  }
  
  return fixedCount;
}

console.log('🔧 Fixing ES module imports...');
const fixedCount = walkDir(distDir);
if (fixedCount > 0) {
  console.log(`✅ Done! Fixed imports in ${fixedCount} file(s).`);
} else {
  console.log('ℹ️  No imports needed fixing (or files already have extensions).');
}
