/**
 * Base Agent - Abstract base class for all agents
 */

import { AgentConfig, AgentContext, AgentResult } from './types';

export abstract class BaseAgent {
  abstract readonly config: AgentConfig;

  /**
   * Get the system prompt for this agent
   */
  protected getSystemPrompt(context: AgentContext): string {
    if (this.config.systemPrompt) {
      return this.config.systemPrompt;
    }
    return this.defaultSystemPrompt();
  }

  /**
   * Default system prompt - override in subclasses
   */
  protected abstract defaultSystemPrompt(): string;

  /**
   * Execute the agent's main logic
   */
  abstract execute(params: Record<string, unknown>, context: AgentContext): Promise<AgentResult>;

  /**
   * Validate parameters before execution
   */
  protected validateParams(params: Record<string, unknown>): string[] {
    // Override in subclasses to add validation
    return [];
  }

  /**
   * Helper to create success result
   */
  protected success(output: string, meta?: Record<string, unknown>): AgentResult {
    return {
      taskId: '',
      agentId: this.config.id,
      success: true,
      output,
      meta,
    };
  }

  /**
   * Helper to create error result
   */
  protected error(message: string): AgentResult {
    return {
      taskId: '',
      agentId: this.config.id,
      success: false,
      output: '',
      error: message,
    };
  }

  /**
   * Read file contents safely
   */
  protected async readFile(filePath: string, context: AgentContext): Promise<string | null> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Write file contents
   */
  protected async writeFile(
    filePath: string,
    content: string,
    context: AgentContext
  ): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Glob files matching pattern
   */
  protected async glob(pattern: string, context: AgentContext): Promise<string[]> {
    try {
      const { glob } = await import('glob');
      const path = await import('path');
      const fullPattern = path.resolve(context.cwd, pattern);
      return glob.sync(fullPattern, { nodir: true });
    } catch {
      return [];
    }
  }
}
