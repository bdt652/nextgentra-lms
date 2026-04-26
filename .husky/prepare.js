#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('🚀 Starting husky setup...');
  execSync('npx husky install', { stdio: 'inherit' });

  // Create pre-commit hook
  const preCommitHook = `#!/usr/bin/env sh
. \"$(dirname -- \"$0\")/_/husky.sh\"

echo "🔍 Running lint-staged..."

npx lint-staged

if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Fix errors before committing."
  exit 1
fi

echo "✅ All checks passed!"
`;

  fs.writeFileSync(
    path.join(__dirname, '.husky', 'pre-commit'),
    preCommitHook
  );

  console.log('✅ Husky setup complete!');
} catch (error) {
  console.error('❌ Husky setup failed:', error);
  process.exit(1);
}
