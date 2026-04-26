/**
 * Agent Utilities - Helper functions cho agent system
 */

import { AgentTask, AgentResult, AgentContext } from './types';

/**
 * Create a unique task ID
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format duration in readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Create agent context from cwd
 */
export async function createContext(cwd: string): Promise<AgentContext> {
  const { fileURLToPath } = await import('url');
  const path = await import('path');
  const { dirname } = path;

  // Try to find project root
  let projectRoot = cwd;
  const markers = ['package.json', 'pyproject.toml', 'Cargo.toml', '.git'];

  while (projectRoot !== path.dirname(projectRoot)) {
    const hasMarker = await Promise.any(
      markers.map(async (marker) => {
        try {
          const fs = await import('fs/promises');
          await fs.access(path.join(projectRoot, marker));
          return true;
        } catch {
          return false;
        }
      })
    ).catch(() => false);

    if (hasMarker) break;
    projectRoot = path.dirname(projectRoot);
  }

  return {
    cwd,
    projectRoot,
    tools: {},
    config: {},
  };
}

/**
 * Parse files from glob patterns
 */
export async function parseFiles(patterns: string[], context: AgentContext): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of patterns) {
    const matched = (await context.glob?.(pattern, context)) || [];
    files.push(...matched);
  }

  return [...new Set(files)]; // Deduplicate
}

/**
 * Read multiple files
 */
export async function readFiles(filePaths: string[]): Promise<Map<string, string>> {
  const fs = await import('fs/promises');
  const results = new Map<string, string>();

  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        results.set(filePath, content);
      } catch {
        results.set(filePath, '');
      }
    })
  );

  return results;
}

/**
 * Write results to files
 */
export async function writeResults(results: Map<string, string>): Promise<boolean> {
  const fs = await import('fs/promises');
  const path = await import('path');

  await Promise.all(
    Array.from(results.entries()).map(async ([filePath, content]) => {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    })
  );

  return true;
}
