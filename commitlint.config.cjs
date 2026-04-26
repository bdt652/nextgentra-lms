const { defineConfig } = require('commitlint')

module.exports = defineConfig({
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Formatting, missing semicolons, etc. (no code change)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'chore', // Changes to build process or auxiliary tools
        'build', // Changes that affect the build system or external dependencies
        'ci', // Changes to CI configuration files and scripts
        'revert', // Revert a previous commit
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'camel-case', 'kebab-case']],
    'header-max-length': [2, 'always', 72],
  },
})
