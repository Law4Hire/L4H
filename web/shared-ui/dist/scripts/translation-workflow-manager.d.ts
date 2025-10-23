#!/usr/bin/env node
interface WorkflowConfig {
    name: string;
    description: string;
    steps: WorkflowStep[];
    schedule?: string;
    enabled: boolean;
}
interface WorkflowStep {
    name: string;
    type: 'validate' | 'sync' | 'report' | 'backup' | 'custom';
    config: any;
    continueOnError?: boolean;
}
interface WorkflowResult {
    workflowName: string;
    success: boolean;
    executedSteps: number;
    failedSteps: number;
    results: StepResult[];
    duration: number;
    summary: string;
}
interface StepResult {
    stepName: string;
    success: boolean;
    duration: number;
    message: string;
    details?: any;
}
declare class TranslationWorkflowManager {
    private workspaceRoot;
    private translationManager;
    private workflowsPath;
    constructor(workspaceRoot?: string);
    /**
     * Execute a workflow by name
     */
    executeWorkflow(workflowName: string): Promise<WorkflowResult>;
    /**
     * Execute a single workflow step
     */
    private executeStep;
    /**
     * Create a workflow
     */
    createWorkflow(workflow: WorkflowConfig): Promise<void>;
    /**
     * Update a workflow
     */
    updateWorkflow(workflowName: string, updates: Partial<WorkflowConfig>): Promise<void>;
    /**
     * Delete a workflow
     */
    deleteWorkflow(workflowName: string): Promise<void>;
    /**
     * List all workflows
     */
    listWorkflows(): Promise<WorkflowConfig[]>;
    /**
     * Load a workflow from file
     */
    private loadWorkflow;
    /**
     * Create predefined workflows
     */
    createPredefinedWorkflows(): Promise<void>;
    /**
     * Create workflow backup
     */
    private createWorkflowBackup;
    /**
     * Copy directory recursively
     */
    private copyDirectory;
    /**
     * Generate workflow template
     */
    generateWorkflowTemplate(outputPath: string): void;
}
export { TranslationWorkflowManager };
export type { WorkflowConfig, WorkflowStep, WorkflowResult, StepResult };
