/**
 * Documenter Agent - Generate documentation cho code
 */

import { BaseAgent } from '../base';
import { AgentConfig, AgentContext, AgentResult } from '../types';

export class DocumenterAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'documenter',
    name: 'Documenter',
    description: 'Generate documentation for code files',
    category: 'docs',
    temperature: 0.4,
  };

  protected defaultSystemPrompt(): string {
    return `You are a technical documentation specialist. Your task is to:
1. Read the provided code
2. Generate clear, comprehensive documentation
3. Include:
   - File/module description
   - Exported functions/classes with signatures
   - Parameter descriptions
   - Return value descriptions
   - Usage examples
   - Related files/modules

Format as Markdown with proper structure.`;
  }

  async execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult> {
    const { filePath, code } = params;

    if (!filePath || !code) {
      return this.error('Missing required params: filePath, code');
    }

    const docTemplate = `# ${filePath.split('/').pop()}

## Description
[Add description here]

## Exports

### Functions

\`\`\`typescript
// TODO: Add function signatures and docs
\`\`\`

### Types/Interfaces

\`\`\`typescript
// TODO: Add type definitions
\`\`\`

## Usage

\`\`\`typescript
// TODO: Add usage examples
\`\`\`

## Notes
- [ ] Needs documentation
`;

    return this.success(docTemplate, {
      filePath: filePath.replace(/\.[^/.]+$/, '.md'),
      generatedAt: new Date().toISOString(),
    });
  }
}
