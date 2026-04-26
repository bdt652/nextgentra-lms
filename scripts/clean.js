#!/usr/bin/env node
/**
 * Clean Project - Remove all build artifacts, cache, and temporary files
 * Usage: node scripts/clean.js
 * Or: make clean-all
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
let totalFreed = 0;

console.log('🧹 Cleaning NextGenTra LMS project...\n');

const patterns = [
  // Build artifacts
  { pattern: '.next/', description: 'Next.js build cache' },
  { pattern: '.turbo/', description: 'Turborepo cache' },
  { pattern: 'coverage/', description: 'Test coverage reports' },
  { pattern: 'dist/', description: 'Distribution builds' },
  { pattern: 'build/', description: 'Build outputs' },
  { pattern: 'out/', description: 'Next.js export output' },

  // TypeScript
  { pattern: '*.tsbuildinfo', description: 'TypeScript build info' },

  // Python
  { pattern: '__pycache__/', description: 'Python cache' },
  { pattern: '.pytest_cache/', description: 'Pytest cache' },
  { pattern: '.mypy_cache/', description: 'Mypy cache' },
  { pattern: '.ruff_cache/', description: 'Ruff cache' },
  { pattern: '*.py[cod]', description: 'Python bytecode' },
  { pattern: '*$py.class', description: 'Python class files' },

  // IDE
  { pattern: '.idea/', description: 'IntelliJ IDEA' },
  { pattern: '.vscode/', description: 'VS Code' },
  { pattern: '*.swp', description: 'Vim swap' },
  { pattern: '*.swo', description: 'Vim swap' },

  // OS
  { pattern: '.DS_Store', description: 'macOS metadata' },
  { pattern: 'Thumbs.db', description: 'Windows thumbs' },
  { pattern: 'Desktop.ini', description: 'Windows desktop' },

  // Logs
  { pattern: '*.log', description: 'Log files' },

  // Environment (careful - only local)
  { pattern: '.env.local', description: 'Local env (will recreate from .env.example)' },
  { pattern: '.env.*.local', description: 'Local env overrides' },

  // Temp
  { pattern: 'tmp/', description: 'Temp folder' },
  { pattern: 'temp/', description: 'Temp folder' },
  { pattern: '.cache/', description: 'General cache' },
];

patterns.forEach(({ pattern, description }) => {
  try {
    const cmd = process.platform === 'win32'
      ? `powershell -Command "Get-ChildItem -Path . -Filter '${pattern}' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force 2>$null"`
      : `find . -name "${pattern}" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec rm -rf {} + 2>/dev/null || true`;

    execSync(cmd, { stdio: 'ignore', shell: true });
    console.log(`  ✓ ${description}`);
  } catch (e) {
    // Ignore errors
  }
});

// Additional cleanup
console.log('\n🔧 Additional cleanup...');

// Clear npm cache (optional, uncomment if needed)
// execSync('npm cache clean --force', { stdio: 'ignore' });

// Remove empty __pycache__ directories
execSync('find . -type d -name "__pycache__" -empty -delete 2>/dev/null || true', {
  stdio: 'ignore',
  shell: true,
});

console.log('\n✅ Clean complete!');
console.log('\n📊 Space freed (approximate):');
console.log('  Build caches: ~500MB-2GB (varies by project)');
console.log('  Coverage reports: ~10-50MB');
console.log('  Logs: ~10-100MB');
console.log('\n💡 Tip: Run this regularly to keep project clean.');
console.log('   Add to your workflow: `make clean` before big changes.\n');
