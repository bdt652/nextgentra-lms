# Agent System - AI-Powered Development Assistants

## Overview

Agent system cung cấp các AI agents để hỗ trợ phát triển code:

- Code Review
- Test Generation
- Documentation
- Security Scanning
- Refactoring
- Bug Fixing

## Installation

```bash
npm install @nextgentra/utils
# hoặc trong workspace
npm install --workspace=packages/utils
```

## Usage

### CLI

```bash
# List all agents
npx nextgentra-agents list

# Run agent on a file
npx nextgentra-agents run code-reviewer -f src/components/Button.tsx

# Run agent with direct code
npx nextgentra-agents run test-generator -c "function add(a,b) { return a+b; }"

# Run multiple agents on all TypeScript files
npx nextgentra-agents run-all code-reviewer test-generator -- "**/*.ts"

# Save results to files
npx nextgentra-agents run documenter -f src/utils/helpers.ts -o docs/helpers.md
```

### Programmatic API

```typescript
import { agentRegistry, AgentContext } from '@nextgentra/utils/agents';

// Create context
const context: AgentContext = {
  cwd: process.cwd(),
  projectRoot: '/path/to/project',
  tools: {},
  config: {},
};

// Run an agent
const result = await agentRegistry.execute(
  {
    id: 'task_123',
    agentId: 'code-reviewer',
    params: {
      filePath: 'src/components/Button.tsx',
      code: `...`,
    },
  },
  context
);

if (result.success) {
  console.log(result.output);
} else {
  console.error(result.error);
}
```

## Built-in Agents

| Agent ID           | Name             | Description                          |
| ------------------ | ---------------- | ------------------------------------ |
| `code-reviewer`    | Code Reviewer    | Review code and suggest improvements |
| `test-generator`   | Test Generator   | Generate unit tests                  |
| `documenter`       | Documenter       | Generate documentation               |
| `security-scanner` | Security Scanner | Scan for vulnerabilities             |
| `refactor`         | Refactorer       | Suggest refactorings                 |
| `bug-fixer`        | Bug Fixer        | Analyze and fix bugs                 |

## Creating Custom Agents

```typescript
import { BaseAgent, AgentConfig, AgentContext, AgentResult } from '@nextgentra/utils/agents';

class MyAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'my-agent',
    name: 'My Custom Agent',
    description: 'Does something cool',
    category: 'custom',
    temperature: 0.5,
  };

  protected defaultSystemPrompt(): string {
    return 'You are a helpful assistant...';
  }

  async execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult> {
    const { filePath, code } = params;

    if (!filePath || !code) {
      return this.error('Missing filePath or code');
    }

    // Your logic here
    const result = this.processCode(code);

    return this.success(result, { filePath });
  }

  private processCode(code: string): string {
    // Implementation
    return `Processed: ${code}`;
  }
}

// Register
import { agentRegistry } from '@nextgentra/utils/agents';
agentRegistry.register(new MyAgent().config, new MyAgent().execute.bind(new MyAgent()));
```

## Configuration

Set environment variables:

```bash
# Required for AI features
ANTHROPIC_API_KEY=your-api-key-here

# Optional: Custom model
ANTHROPIC_MODEL=claude-sonnet-4-5-20250514

# Optional: Temperature override
AGENT_TEMPERATURE=0.7
```

## AI Integration

To enable AI-powered agents:

1. Install `@anthropic-ai/sdk`
2. Set `ANTHROPIC_API_KEY` environment variable
3. Agents will automatically use Claude when available

Without API key, agents return placeholder templates.

## Output

Results are saved to `.agents/<agent-id>/<relative-path>` when using `run-all`.

Example:

```
.agents/
├── code-reviewer/
│   └── src/components/Button.tsx.review.md
├── test-generator/
│   └── src/components/Button.tsx.test.ts
└── documenter/
    └── src/components/Button.tsx.md
```

## Extending

1. Create new agent in `agents/` directory
2. Export from `agents/index.ts`
3. Register in CLI or programmatically

## Architecture

```
packages/utils/agents/
├── base.ts          # BaseAgent class
├── registry.ts      # AgentRegistry singleton
├── types.ts         # Type definitions
├── utils.ts         # Helper functions
├── cli.ts           # Command-line interface
├── index.ts         # Public exports
├── agents/          # Built-in agents
│   ├── code-reviewer.ts
│   ├── test-generator.ts
│   ├── documenter.ts
│   ├── security-scanner.ts
│   ├── refactor.ts
│   └── bug-fixer.ts
└── templates/       # Agent templates
```

## License

MIT
