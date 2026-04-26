/**
 * Claude Client - Helper để gọi Claude API
 */

import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

/**
 * Get or create Anthropic client
 */
export function getClaudeClient(apiKey?: string): Anthropic | null {
  if (anthropic) {
    return anthropic;
  }

  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return null;
  }

  anthropic = new Anthropic({
    apiKey: key,
    timeout: 120000, // 2 minutes
  });

  return anthropic;
}

/**
 * Call Claude API
 */
export async function callClaude(
  prompt: string,
  systemPrompt?: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const client = getClaudeClient();
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const model = options.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250514';
  const temperature = options.temperature ?? parseFloat(process.env.AGENT_TEMPERATURE || '0.5');
  const maxTokens = options.maxTokens || 4000;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt || 'You are a helpful assistant.',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response.content[0].text;
}

/**
 * Call Claude with code context
 */
export async function callClaudeWithCode(
  code: string,
  instruction: string,
  filePath?: string,
  options: {
    model?: string;
    temperature?: number;
  } = {}
): Promise<string> {
  const systemPrompt = `You are an expert developer assistant. Analyze the provided code and ${instruction}.

When responding:
- Be specific and actionable
- Include code examples where relevant
- Consider best practices and security
- Explain the "why" behind suggestions`;

  const prompt = filePath
    ? `File: ${filePath}\n\nCode:\n\`\`\`\n${code}\n\`\`\`\n\nTask: ${instruction}`
    : `Code:\n\`\`\`\n${code}\n\`\`\`\n\nTask: ${instruction}`;

  return callClaude(prompt, systemPrompt, options);
}
