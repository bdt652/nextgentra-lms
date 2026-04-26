# 🤖 Agent System - NextGenTra LMS

Hệ thống AI Agents được tích hợp sẵn để hỗ trợ phát triển LMS. Các agent có thể:

- 🔍 **Review code** - Phát hiện bugs, security issues
- 🧪 **Generate tests** - Tạo unit tests tự động
- 📚 **Document code** - Tạo documentation
- 🔒 **Scan security** - Quét vulnerabilities
- 🔧 **Refactor** - Gợi ý cải tiến code
- 🐛 **Fix bugs** - Phân tích và suggest fixes

## 📦 Installation

```bash
# Dependencies đã có sẵn trong monorepo
npm install
```

## 🚀 Quick Start

### 1. List Available Agents

```bash
npx nextgentra-agents list
```

Output:

```
📋 Available Agents:

ID                    Name                  Category           Description
------------------------------------------------------------------------------------
code-reviewer         Code Reviewer         quality            Review code and suggest improvements
code-reviewer-full    Full-Featured Code    quality            AI-powered code review using Claude
test-generator        Test Generator        testing            Generate unit tests
documenter            Documenter            docs               Generate documentation for code files
security-scanner      Security Scanner      security           Scan code for security vulnerabilities
refactor              Code Refactorer       refactoring        Refactor code to improve quality and maintainability
bug-fixer             Bug Fixer             debugging          Analyze and suggest fixes for bugs
```

### 2. Run Agent on a File

```bash
# Code review với Claude AI
npx nextgentra-agents run code-reviewer-full -f src/components/CourseCard.tsx

# Generate tests
npx nextgentra-agents run test-generator -f src/utils/helpers.ts -o tests/helpers.test.ts

# Generate docs
npx nextgentra-agents run documenter -f src/app/api/courses.ts -o docs/courses-api.md
```

### 3. Run Multiple Agents

```bash
# Run on all TypeScript files
npx nextgentra-agents run-all code-reviewer test-generator -- "**/*.ts"

# Run on specific directory
npx nextgentra-agents run-all code-reviewer security-scanner -- "src/**/*.tsx"
```

Kết quả sẽ được lưu vào `.agents/<agent-id>/<file-path>`.

## 🔑 Configuration

Tạo file `.env` trong `packages/utils/agents/`:

```bash
# Required cho AI features
ANTHROPIC_API_KEY=your-claude-api-key

# Optional
ANTHROPIC_MODEL=claude-sonnet-4-5-20250514
AGENT_TEMPERATURE=0.5
AGENT_MAX_TOKENS=4000
```

Lưu ý: Không cần API key vẫn có thể dùng agents (nhưng sẽ chạy ở mode placeholder).

## 📁 Output Structure

```
.agents/
├── code-reviewer-full/
│   └── src/components/Button.tsx.review.md
├── test-generator/
│   └── src/components/Button.tsx.test.ts
├── documenter/
│   └── src/components/Button.tsx.md
└── security-scanner/
    └── src/components/Button.tsx.security.md
```

## 🛠️ Programmatic Usage

```typescript
import { agentRegistry, AgentContext } from '@nextgentra/utils/agents';

// Setup context
const context: AgentContext = {
  cwd: process.cwd(),
  projectRoot: '/path/to/project',
  tools: {},
  config: {},
};

// Register custom agent
import { MyCustomAgent } from './my-agent';
const myAgent = new MyCustomAgent();
agentRegistry.register(myAgent.config, myAgent.execute.bind(myAgent));

// Run agent
const result = await agentRegistry.execute(
  {
    id: 'task-1',
    agentId: 'code-reviewer-full',
    params: {
      filePath: 'src/app/page.tsx',
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

## 🧱 Creating Custom Agents

Template có sẵn trong `packages/utils/agents/templates/agent-template.ts`:

```typescript
import { BaseAgent } from './base';
import { AgentConfig, AgentContext } from './types';

export class MyAgent extends BaseAgent {
  readonly config: AgentConfig = {
    id: 'my-agent',
    name: 'My Agent',
    description: 'Does something cool',
    category: 'custom',
    temperature: 0.5,
  };

  async execute(params: Record<string, unknown>, context: AgentContext) {
    const { filePath, code } = params;
    // Your logic here
    return this.success('Result');
  }
}
```

## 📊 Agent Categories

| Category      | Agents                            | Purpose                      |
| ------------- | --------------------------------- | ---------------------------- |
| `quality`     | code-reviewer, code-reviewer-full | Code quality assessment      |
| `testing`     | test-generator                    | Test creation                |
| `docs`        | documenter                        | Documentation generation     |
| `security`    | security-scanner                  | Vulnerability scanning       |
| `refactoring` | refactor                          | Code improvement suggestions |
| `debugging`   | bug-fixer                         | Bug analysis and fixes       |
| `custom`      | Your agents                       | Custom functionality         |

## 🔌 Claude Integration

Agent system tích hợp sẵn với Claude API:

```typescript
import { callClaude, callClaudeWithCode } from '@nextgentra/utils/agents';

// Simple call
const response = await callClaude('Explain this code', systemPrompt);

// With code context
const review = await callClaudeWithCode(code, 'Review for security issues', 'src/auth.ts', {
  temperature: 0.3,
});
```

## 📝 Agent Development Workflow

1. **Clone template**: Copy `templates/agent-template.ts` to `agents/my-agent.ts`
2. **Implement logic**: Override `execute()` method
3. **Register**: Add to `agents/index.ts` exports
4. **Test**: Run `npm run agents:demo` or `npx nextgentra-agents run my-agent -f <file>`
5. **Document**: Add description to `config` and update README

## 🎯 Use Cases

### Student Portal Development

```bash
# Review new component
npx nextgentra-agents run code-reviewer-full -f apps/student-portal/src/components/CourseCard.tsx

# Generate tests for API client
npx nextgentra-agents run test-generator -f apps/student-portal/lib/api/client.ts -o apps/student-portal/__tests__/api/client.test.ts
```

### Teacher Portal Development

```bash
# Security scan before deploy
npx nextgentra-agents run-all security-scanner -- "apps/teacher-portal/src/app/**/*.tsx"

# Generate API documentation
npx nextgentra-agents run documenter -f apps/teacher-portal/app/api/courses/route.ts
```

### Backend API

```bash
# Review FastAPI endpoints
npx nextgentra-agents run code-reviewer-full -f backend/app/api/courses.py

# Generate pytest cases
npx nextgentra-agents run test-generator -f backend/app/services/course_service.py -o backend/tests/test_course_service.py
```

## ⚡ Performance Tips

1. **Batch processing**: Use `run-all` for multiple files
2. **Selective runs**: Target specific directories with glob patterns
3. **Cache**: Results are saved in `.agents/` - no need to re-run on unchanged files
4. **Parallel**: Run different agents simultaneously on different terminals

## 🐛 Troubleshooting

### ANTHROPIC_API_KEY not set

- Agents still work but return placeholder templates
- Set key in `packages/utils/agents/.env`

### Import errors

```bash
# Reinstall dependencies
npm install --workspace=packages/utils
```

### Permission denied on CLI

```bash
# Make executable (Unix/Mac)
chmod +x node_modules/.bin/nextgentra-agents
```

## 📚 API Reference

### AgentConfig

```typescript
interface AgentConfig {
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // Short description
  category: string; // Group category
  model?: string; // Claude model (default from env)
  temperature?: number; // 0-1 (default 0.5)
  systemPrompt?: string; // Override system prompt
}
```

### AgentResult

```typescript
interface AgentResult {
  taskId: string;
  agentId: string;
  success: boolean;
  output: string;
  error?: string;
  meta?: Record<string, unknown>;
  duration?: number;
}
```

## 🤝 Contributing

1. Create agent using template
2. Add comprehensive tests
3. Update this README
4. Submit PR

## 📄 License

MIT - See main LICENSE file.
