/**
 * Code Reviewer Agent - Review code và đưa ra suggestions
 */

import { BaseAgent } from '../base';
import { AgentConfig, AgentContext, AgentResult } from '../types';

export class CodeReviewerAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Review code and provide improvement suggestions',
    category: 'quality',
    temperature: 0.3,
  };

  protected defaultSystemPrompt(): string {
    return `You are a senior code reviewer. Your task is to:
1. Review the provided code
2. Identify potential issues (bugs, performance, security)
3. Suggest improvements following best practices
4. Provide specific, actionable feedback

Focus on:
- Code clarity and maintainability
- Error handling
- Security vulnerabilities
- Performance optimizations
- Following project conventions

Be constructive and specific.`;
  }

  async execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult> {
    const { filePath, code } = params;

    if (!filePath || !code) {
      return this.error('Missing required params: filePath, code');
    }

    // In a real implementation, this would call Claude API
    const review = `# Code Review: ${filePath}

## Summary
[Auto-generated review will appear here]

## Issues Found
- None detected (this is a placeholder)

## Suggestions
- This agent needs Claude API integration to function

## Notes
- Install @anthropic-ai/sdk to enable AI-powered reviews
- Or implement custom review logic`;

    return this.success(review, { filePath, linesOfCode: code.split('\n').length });
  }
}
