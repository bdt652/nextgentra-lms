#!/usr/bin/env node

/**
 * Agent CLI - Command-line interface để chạy agents
 *
 * Usage:
 *   npx @nextgentra/utils agents <command> [options]
 *
 * Commands:
 *   list                    - List all registered agents
 *   run <agentId> [opts]    - Run a specific agent
 *   run-all <patterns>      - Run agent on multiple files
 */

import { agentRegistry } from './registry';
import { AgentTask, AgentResult, createContext, parseFiles, readFiles } from './utils';
import { generateTaskId } from './utils';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Auto-register built-in agents
import {
  CodeReviewerAgent,
  FullFeaturedCodeReviewerAgent,
  TestGeneratorAgent,
  DocumenterAgent,
  SecurityScannerAgent,
  RefactorAgent,
  BugFixerAgent,
} from './index';

// Helper to register agent
function registerAgent(agent: any): void {
  try {
    agentRegistry.register(agent.config, agent.execute.bind(agent));
  } catch (error) {
    // Agent already registered, ignore
  }
}

// Register all built-in agents
registerAgent(new CodeReviewerAgent());
registerAgent(new FullFeaturedCodeReviewerAgent());
registerAgent(new TestGeneratorAgent());
registerAgent(new DocumenterAgent());
registerAgent(new SecurityScannerAgent());
registerAgent(new RefactorAgent());
registerAgent(new BugFixerAgent());

async function listAgents() {
  const agents = agentRegistry.list();
  console.log('\n📋 Available Agents:\n');
  console.log('ID'.padEnd(20) + 'Name'.padEnd(25) + 'Category'.padEnd(15) + 'Description');
  console.log('-'.repeat(85));
  for (const agent of agents) {
    console.log(
      agent.id.padEnd(20) +
      agent.name.padEnd(25) +
      agent.category.padEnd(15) +
      agent.description
    );
  }
  console.log('');
}

async function runAgent(agentId: string, options: Record<string, unknown>) {
  const agent = agentRegistry.get(agentId);
  if (!agent) {
    console.error(`❌ Agent "${agentId}" not found`);
    process.exit(1);
  }

  const { filePath, files, code } = options as { filePath?: string; files?: string[]; code?: string };

  // Get files to process
  let filesToProcess: string[] = files || [];
  if (filePath) {
    filesToProcess.push(filePath as string);
  }

  // If we have code but no files, use stdin placeholder
  if (code && filesToProcess.length === 0) {
    filesToProcess = ['<stdin>'];
  }

  if (filesToProcess.length === 0) {
    console.error('❌ Must provide either --code or --file/-f');
    process.exit(1);
  }

  // Get code from file or direct input
  let actualCode = code as string;

  // Create context
  const cwd = process.cwd();
  const context = await createContext(cwd);

  // Process files
  for (const file of filesToProcess) {
    let fileContent = actualCode;
    if (!fileContent && file !== '<stdin>') {
      fileContent = await readFile(file, 'utf-8').catch(() => '');
    }

    if (!fileContent) {
      console.warn(`⚠️  Skipping unreadable file: ${file}`);
      continue;
    }

    const task: AgentTask = {
      id: generateTaskId(),
      agentId,
      params: {
        filePath: file,
        code: fileContent,
        ...options,
      },
    };

    console.log(`\n🚀 Running ${agent.config.name} on ${file}...\n`);

    const startTime = Date.now();
    const result: AgentResult = await agentRegistry.execute(task, context);
    result.duration = Date.now() - startTime;

    if (result.success) {
      console.log('✅ Success!\n');
      console.log(result.output);
    } else {
      console.error('❌ Failed:', result.error);
    }

    console.log(`\n⏱️  Duration: ${result.duration}ms`);
  }
}

async function runAllOnFiles(agentIds: string[], patterns: string[]) {
  const cwd = process.cwd();
  const context = await createContext(cwd);

  // Get all files matching patterns
  const files = await parseFiles(patterns, context);
  if (files.length === 0) {
    console.log('No files found matching patterns');
    return;
  }

  console.log(`\n📁 Found ${files.length} files\n`);

  // Read all files
  const fileContents = await readFiles(files);

  // Run each agent on each file
  for (const agentId of agentIds) {
    const agent = agentRegistry.get(agentId);
    if (!agent) {
      console.warn(`⚠️  Agent "${agentId}" not found, skipping`);
      continue;
    }

    console.log(`\n🎯 Running ${agent.config.name} on all files...\n`);

    for (const [filePath, content] of fileContents.entries()) {
      const task: AgentTask = {
        id: generateTaskId(),
        agentId,
        params: {
          filePath,
          code: content,
        },
      };

      const result = await agentRegistry.execute(task, context);

      if (result.success && result.output) {
        // Write output to .agents directory
        const outputPath = join(cwd, '.agents', agentId, filePath.replace(/^\//, ''));
        const fs = await import('fs/promises');
        await fs.mkdir(join(cwd, '.agents', agentId), { recursive: true });
        await fs.mkdir(join(cwd, '.agents', agentId, join(...filePath.split('/').slice(0, -1))), { recursive: true });
        await fs.writeFile(outputPath, result.output, 'utf-8');
        console.log(`  ✓ ${filePath} → ${outputPath}`);
      }
    }
  }

  console.log('\n✅ All done! Results saved to .agents/');
}

// Main CLI
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
  case '--list':
  case '-l':
    listAgents();
    break;

  case 'run':
  case '--run':
    const agentId = args[1];
    if (!agentId) {
      console.error('Usage: agents run <agentId> --file <path> [--code <code>]');
      process.exit(1);
    }

    // Parse options
    const options: Record<string, unknown> = {};
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--file' || args[i] === '-f') {
        options.filePath = args[++i];
      } else if (args[i] === '--code' || args[i] === '-c') {
        options.code = args[++i];
      } else if (args[i] === '--output' || args[i] === '-o') {
        options.output = args[++i];
      } else if (args[i] === '--') {
        // Rest is freeform
        options.rest = args.slice(i + 1);
        break;
      }
    }

    runAgent(agentId, options).catch(console.error);
    break;

  case 'run-all':
  case '--run-all':
    const agentIds = args.slice(1).filter(a => !a.startsWith('--'));
    const patterns = (args.includes('--') ? args.slice(args.indexOf('--') + 1) : ['**/*']);

    if (agentIds.length === 0) {
      console.error('Usage: agents run-all <agentId1> [agentId2...] [-- <patterns>]');
      console.error('Example: agents run-all code-reviewer test-generator -- src/**/*.ts');
      process.exit(1);
    }

    runAllOnFiles(agentIds, patterns).catch(console.error);
    break;

  case 'help':
  case '--help':
  case '-h':
  case '':
    console.log(`
Agent CLI - AI-powered development assistants

Commands:
  list                        List all available agents
  run <agentId> [options]    Run agent on specific file/code
  run-all <agents> [patterns] Run agent(s) on multiple files

Options for 'run':
  -f, --file <path>           File to process
  -c, --code <code>           Direct code input
  -o, --output <path>         Output file (default: stdout)

Options for 'run-all':
  -- <patterns>               Glob patterns (default: **/*)

Examples:
  npx agents list
  npx agents run code-reviewer -f src/components/Button.tsx
  npx agents run test-generator -f src/utils/helpers.ts -o tests/helpers.test.ts
  npx agents run-all code-reviewer test-generator -- src/**/*.ts

Environment:
  ANTHROPIC_API_KEY           API key for Claude (required for AI features)
`);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run "npx agents help" for usage');
    process.exit(1);
}
