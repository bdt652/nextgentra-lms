/**
 * Full-Featured Code Reviewer Agent - Sử dụng Claude API
 */

import { BaseAgent } from '../base';
import { AgentConfig, AgentContext, AgentResult } from '../types';
import { callClaudeWithCode } from '../claude-client';

export class FullFeaturedCodeReviewerAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'code-reviewer-full',
    name: 'Full-Featured Code Reviewer',
    description: 'AI-powered code review using Claude',
    category: 'quality',
    temperature: 0.3,
    model: 'claude-sonnet-4-5-20250514',
  };

  protected defaultSystemPrompt(): string {
    return `You are a senior software engineer conducting a thorough code review.

Review criteria:
1. **Code Quality**: Readability, structure, naming
2. **Best Practices**: Following language/framework conventions
3. **Security**: Potential vulnerabilities (SQLi, XSS, etc.)
4. **Performance**: Inefficiencies, O(n²) issues
5. **Maintainability**: Coupling, complexity, tech debt
6. **Testing**: Missing tests, edge cases
7. **Documentation**: Missing comments, unclear logic

Output format:
## Summary
[Overall assessment]

## Issues Found
### Critical
- [ ] Issue description with line numbers
### High
- [ ] Issue description
### Medium
- [ ] Issue description
### Low
- [ ] Nitpicks

## Suggestions
- [Specific improvements with code examples]

## Strengths
- [What's done well]

## Action Items
- [ ] Prioritized tasks for developer`;
  }

  async execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult> {
    const { filePath, code, focusAreas } = params;

    if (!filePath || !code) {
      return this.error('Missing required params: filePath, code');
    }

    try {
      // Check if Claude API is available
      const instruction = focusAreas
        ? `Review this code focusing on: ${(focusAreas as string[]).join(', ')}`
        : 'Review this code for quality, security, and best practices';

      const review = await callClaudeWithCode(
        code,
        instruction,
        filePath as string,
        {
          temperature: this.config.temperature || 0.3,
          model: this.config.model,
        }
      );

      return this.success(review, {
        filePath,
        agentVersion: 'full-featured',
        usedClaude: true,
      });
    } catch (error) {
      // Fallback to basic template if Claude fails
      const fallback = this.generateFallbackReview(filePath as string, code);
      return this.success(fallback, {
        filePath,
        agentVersion: 'fallback',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private generateFallbackReview(filePath: string, code: string): string {
    const lines = code.split('\n').length;
    const hasAsync = code.includes('async ');
    const hasTry = code.includes('try ');
    const hasConsole = code.includes('console.');

    return `# Code Review: ${filePath}

## Summary
Basic review (Claude API unavailable)

## Stats
- Lines: ${lines}
- Async: ${hasAsync ? '✓' : '✗'}
- Try-catch: ${hasTry ? '✓' : '✗'}

## Quick Checks
${hasConsole ? '⚠️ Contains console statements (remove before prod)' : '✓ No console statements'}

## Recommendations
1. Set ANTHROPIC_API_KEY for AI-powered review
2. Run linter: npm run lint
3. Add unit tests
4. Review error handling

## Note
This is a basic template. For comprehensive review, configure Claude API.`;
  }
}
