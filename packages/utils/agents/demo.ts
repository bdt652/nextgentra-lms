#!/usr/bin/env node

/**
 * Agent Demo - Demo cách sử dụng agent system
 */

import { agentRegistry } from './registry';
import { FullFeaturedCodeReviewerAgent, TestGeneratorAgent } from './index';
import { createContext } from './utils';

async function demo() {
  console.log('🚀 Agent System Demo\n');

  // Create context
  const context = await createContext(process.cwd());
  console.log(`📁 Project root: ${context.projectRoot}\n`);

  // Create and register agents
  const reviewer = new FullFeaturedCodeReviewerAgent();
  const testGenerator = new TestGeneratorAgent();

  agentRegistry.register(reviewer.config, reviewer.execute.bind(reviewer));
  agentRegistry.register(testGenerator.config, testGenerator.execute.bind(testGenerator));

  console.log('📋 Registered Agents:');
  for (const agent of agentRegistry.list()) {
    console.log(`  - ${agent.id}: ${agent.description}`);
  }
  console.log('');

  // Demo code
  const demoCode = `function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += items[i].price * items[i].quantity;
    }
    return total;
  }`;

  console.log('📝 Demo Code:\n');
  console.log(demoCode);
  console.log('\n');

  // Run code reviewer
  console.log('🔍 Running Code Reviewer...\n');
  const reviewTask = {
    id: 'demo-review-1',
    agentId: 'code-reviewer-full',
    params: {
      filePath: 'demo.js',
      code: demoCode,
    },
  };

  const reviewResult = await agentRegistry.execute(reviewTask, context);
  console.log(reviewResult.output);
  console.log('\n');

  // Run test generator
  console.log('🧪 Running Test Generator...\n');
  const testTask = {
    id: 'demo-test-1',
    agentId: 'test-generator',
    params: {
      filePath: 'demo.js',
      code: demoCode,
      framework: 'jest',
    },
  };

  const testResult = await agentRegistry.execute(testTask, context);
  console.log(testResult.output);
  console.log('\n');

  console.log('✅ Demo complete!');
  console.log('\n📚 Next steps:');
  console.log('1. Set ANTHROPIC_API_KEY for AI-powered agents');
  console.log('2. Run: npx nextgentra-agents list');
  console.log('3. Run: npx nextgentra-agents run code-reviewer-full -f your-file.ts');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

export { demo };
