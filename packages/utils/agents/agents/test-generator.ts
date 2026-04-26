/**
 * Test Generator Agent - Tạo unit tests cho code
 */

import { BaseAgent } from '../base';
import { AgentConfig, AgentContext, AgentResult } from '../types';

export class TestGeneratorAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'test-generator',
    name: 'Test Generator',
    description: 'Generate unit tests for code files',
    category: 'testing',
    temperature: 0.5,
  };

  protected defaultSystemPrompt(): string {
    return `You are a test writing specialist. Your task is to:
1. Read the provided code
2. Generate comprehensive unit tests
3. Cover edge cases and error scenarios
4. Follow testing best practices

Generate tests for:
- All public functions/classes
- Edge cases and boundary conditions
- Error handling paths
- Integration scenarios

Use the testing framework appropriate for the project (Jest, Pytest, etc.).`;
  }

  async execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult> {
    const { filePath, code, framework = 'jest' } = params;

    if (!filePath || !code) {
      return this.error('Missing required params: filePath, code');
    }

    const testTemplate = `import { describe, it, expect, jest } from '@jest/globals';

describe('${filePath.split('/').pop()?.replace(/\.[^/.]+$/, '')}', () => {
  it('should handle basic functionality', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });

  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  });

  it('should handle errors gracefully', () => {
    // TODO: Add error case tests
  });
});`;

    return this.success(testTemplate, {
      filePath: filePath.replace(/\.[^/.]+$/, '.test.ts'),
      framework,
      generatedAt: new Date().toISOString(),
    });
  }
}
