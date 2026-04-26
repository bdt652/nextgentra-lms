/**
 * Agent Types - Type definitions for the agent system
 */

export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;
  /** Display name */
  name: string;
  /** Description of what the agent does */
  description: string;
  /** Category for grouping (e.g., 'testing', 'security', 'refactoring') */
  category: string;
  /** Default model to use */
  model?: string;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** System prompt override */
  systemPrompt?: string;
}

export interface AgentContext {
  /** Current working directory */
  cwd: string;
  /** Project root path */
  projectRoot: string;
  /** Available tools/functions */
  tools: Record<string, Function>;
  /** Configuration values */
  config: Record<string, unknown>;
}

export interface AgentTask {
  /** Task ID */
  id: string;
  /** Agent to run */
  agentId: string;
  /** Task parameters */
  params: Record<string, unknown>;
  /** Optional: specific files to process */
  files?: string[];
  /** Optional: callback when complete */
  callback?: (result: AgentResult) => void;
}

export interface AgentResult {
  /** Task ID */
  taskId: string;
  /** Agent that executed */
  agentId: string;
  /** Success status */
  success: boolean;
  /** Output/result */
  output: string;
  /** Any errors */
  error?: string;
  /** Metadata */
  meta?: Record<string, unknown>;
  /** Duration in ms */
  duration?: number;
}

export type AgentHandler = (
  params: Record<string, unknown>,
  context: AgentContext
) => Promise<AgentResult>;

export interface RegisteredAgent {
  config: AgentConfig;
  handler: AgentHandler;
}
