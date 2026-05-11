/**
 * Lint-staged configuration
 * Chạy các linters trên staged files trước khi commit
 */
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],
  '*.{js,jsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],
  '*.{json,md,html,css,scss,less}': [
    'prettier --write',
  ],
};