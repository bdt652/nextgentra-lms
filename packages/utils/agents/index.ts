/**
 * Agent System - Tạo và quản lý AI agents để hỗ trợ phát triển
 *
 * Các agent có thể:
 * - Review code
 * - Tạo tests
 * - Generate documentation
 * - Fix bugs
 * - Refactor code
 * - Security scanning
 */

export * from './base';
export * from './registry';
export * from './types';
export * from './utils';
export * from './claude-client';

// Pre-built agents
export { CodeReviewerAgent } from './agents/code-reviewer';
export { FullFeaturedCodeReviewerAgent } from './agents/code-reviewer-full';
export { TestGeneratorAgent } from './agents/test-generator';
export { DocumenterAgent } from './agents/documenter';
export { SecurityScannerAgent } from './agents/security-scanner';
export { RefactorAgent } from './agents/refactor';
export { BugFixerAgent } from './agents/bug-fixer';
