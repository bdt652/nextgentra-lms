/**
 * Bug Fixer Agent - Suggest fixes for bugs
 */

import { BaseAgent } from '../base';
import { AgentConfig, AgentContext, AgentResult } from '../types';

export class BugFixerAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'bug-fixer',
    name: 'Bug Fixer',
    description: 'Analyze and suggest fixes for bugs',
    category: 'debugging',
    temperature: 0.3,
  };

  protected defaultSystemPrompt(): string {
    return `You are a debugging specialist. When given:
1. Bug description
2. Error logs
3. Relevant code

Provide:
1. Root cause analysis
2. Step-by-step fix
3. Prevention measures
4. Test cases to verify fix

Be thorough and educational.`;
  }

  async execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult> {
    const { filePath, errorMessage, code, bugDescription } = params;

    if (!filePath) {
      return this.error('Missing required param: filePath');
    }

    const analysis = `# Bug Analysis: ${filePath}

## Problem
${bugDescription || 'No description provided'}

## Error
\`\`\`
${errorMessage || 'No error message provided'}
\`\`\`

## Root Cause Analysis
[Analyzing code...]

## Suggested Fix
\`\`\`typescript
// TODO: Provide corrected code
\`\`\`

## Steps to Reproduce
1. [Describe steps]

## Prevention
- Add error handling
- Write tests for this scenario
- Add input validation

## Note
This is a placeholder. Integrate with Claude API for AI-powered bug fixing.
`;

    return this.success(analysis, {
      filePath,
      bugType: 'unknown',
      severity: 'unknown',
    });
  }
}
