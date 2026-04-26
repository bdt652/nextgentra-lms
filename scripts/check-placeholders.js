#!/usr/bin/env node
/**
 * Check for placeholder code in staged files
 * Run as: node scripts/check-placeholders.js
 */

const { execSync } = require('child_process');

const placeholderPatterns = [
  /Base template.*Add your features/i,
  /This is a placeholder/i,
  /TODO:/i,
  /FIXME:/i,
  /XXX:/i,
  /"use client";\s*$/, // Empty client components (single line)
  /export default function.*\{\s*return null;\s*\}/i, // Empty returns
];

console.log('🔍 Checking for placeholder code...\n');

try {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8'
  }).split('\n').filter(f => f.trim());

  let foundPlaceholders = false;
  const fileExtensions = ['.ts', '.tsx', '.py', '.js', '.jsx'];

  stagedFiles.forEach(file => {
    if (!fileExtensions.some(ext => file.endsWith(ext))) {
      return; // Skip non-code files
    }

    try {
      const content = execSync(`git show :${file}`, { encoding: 'utf8' });

      placeholderPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`⚠️  ${file}: Found placeholder pattern`);
          console.log(`   Pattern: ${pattern.toString().slice(0, 50)}...`);
          foundPlaceholders = true;
        }
      });

      // Check for empty/minimal components
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
        if (lines.length <= 5) {
          console.log(`⚠️  ${file}: Very few lines - might be incomplete`);
          foundPlaceholders = true;
        }
      }
    } catch (e) {
      // File might be binary or deleted, skip
    }
  });

  if (foundPlaceholders) {
    console.log('\n❌ Found placeholder or incomplete code.');
    console.log('   Review and complete before committing.\n');
    process.exit(1);
  } else {
    console.log('✅ No placeholder code found.\n');
    process.exit(0);
  }
} catch (error) {
  console.error('Error checking placeholders:', error.message);
  process.exit(1);
}
