/**
 * Agent Registry - Central registry for all agents
 */

import {
  RegisteredAgent,
  AgentConfig,
  AgentHandler,
  AgentContext,
  AgentTask,
  AgentResult,
} from './types';

class AgentRegistry {
  private agents: Map<string, RegisteredAgent> = new Map();

  /**
   * Register a new agent
   */
  register(config: AgentConfig, handler: AgentHandler): void {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent with id "${config.id}" is already registered`);
    }
    this.agents.set(config.id, { config, handler });
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * Get agent by ID
   */
  get(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  list(): AgentConfig[] {
    return Array.from(this.agents.values()).map((a) => a.config);
  }

  /**
   * Get agents by category
   */
  listByCategory(category: string): AgentConfig[] {
    return this.list().filter((a) => a.category === category);
  }

  /**
   * Execute an agent task
   */
  async execute(task: AgentTask, context: AgentContext): Promise<AgentResult> {
    const agent = this.agents.get(task.agentId);
    if (!agent) {
      return {
        taskId: task.id,
        agentId: task.agentId,
        success: false,
        output: '',
        error: `Agent "${task.agentId}" not found`,
      };
    }

    const startTime = Date.now();
    try {
      const result = await agent.handler(task.params, context);
      result.duration = Date.now() - startTime;
      result.taskId = task.id;
      result.agentId = task.agentId;
      return result;
    } catch (error) {
      return {
        taskId: task.id,
        agentId: task.agentId,
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if an agent exists
   */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get count of registered agents
   */
  count(): number {
    return this.agents.size;
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agents.clear();
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
