/**
 * [Agent Name] Agent - Template cho agent mới
 *
 * Copy this file và rename để tạo agent mới
 */

import { BaseAgent } from '../base';
import { AgentConfig, AgentContext, AgentResult } from '../types';

export class MyCustomAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'my-custom-agent',
    name: 'My Custom Agent',
    description: 'Mô tả ngắn về agent làm gì',
    category: 'custom', // 'testing', 'security', 'refactoring', 'docs', 'debugging', etc.
    temperature: 0.5, // 0-1, lower = more deterministic
    // systemPrompt: 'Custom system prompt...' // optional override
  };

  protected defaultSystemPrompt(): string {
    return `You are a specialized AI assistant that:
1. Receives code files as input
2. Processes them according to your specialty
3. Returns formatted output

Be thorough and follow best practices.`;
  }

  async execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult> {
    // Required params
    const { filePath, code } = params;

    if (!filePath || !code) {
      return this.error('Missing required params: filePath, code');
    }

    // Optional: Validate params
    const validationErrors = this.validateParams(params);
    if (validationErrors.length > 0) {
      return this.error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    try {
      // Your agent logic here
      const result = await this.process(filePath, code, context);

      return this.success(result, {
        filePath,
        processedAt: new Date().toISOString(),
      });
    } catch (error) {
      return this.error(error instanceof Error ? error.message : String(error));
    }
  }

  protected validateParams(params: Record<string, unknown>): string[] {
    const errors: string[] = [];

    // Add custom validation
    if (params.filePath && typeof params.filePath !== 'string') {
      errors.push('filePath must be a string');
    }

    return errors;
  }

  private async process(filePath: string, code: string, context: AgentContext): Promise<string> {
    // Main processing logic

    // Example: Use Claude API
    if (context.config.anthropicApiKey) {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: context.config.anthropicApiKey as string });

      const response = await anthropic.messages.create({
        model: this.config.model || 'claude-sonnet-4-5-20250514',
        max_tokens: 4000,
        temperature: this.config.temperature || 0.5,
        system: this.getSystemPrompt(context),
        messages: [
          {
            role: 'user',
            content: `Process this file:\n\nFile: ${filePath}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
          },
        ],
      });

      return response.content[0].text;
    }

    // Fallback: Return template if no API key
    return `# Output for ${filePath}\n\n[Enable ANTHROPIC_API_KEY for AI processing]\n\n## Processed Code\n\`\`\`\n${code.substring(0, 200)}...\n\`\`\``;
  }
}

// Register the agent
import { agentRegistry } from '../registry';

const agent = new MyCustomAgent();
agentRegistry.register(agent.config, agent.execute.bind(agent));
