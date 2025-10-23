#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { TranslationManager } from './translation-manager';
class TranslationWorkflowManager {
    constructor(workspaceRoot = process.cwd()) {
        Object.defineProperty(this, "workspaceRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "translationManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "workflowsPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.workspaceRoot = workspaceRoot;
        this.translationManager = new TranslationManager({ workspaceRoot });
        this.workflowsPath = path.join(workspaceRoot, '.kiro', 'translation-workflows');
        // Ensure workflows directory exists
        if (!fs.existsSync(this.workflowsPath)) {
            fs.mkdirSync(this.workflowsPath, { recursive: true });
        }
    }
    /**
     * Execute a workflow by name
     */
    async executeWorkflow(workflowName) {
        console.log(`🔄 Executing workflow: ${workflowName}`);
        const startTime = Date.now();
        try {
            const workflow = await this.loadWorkflow(workflowName);
            if (!workflow.enabled) {
                throw new Error(`Workflow ${workflowName} is disabled`);
            }
            const results = [];
            let executedSteps = 0;
            let failedSteps = 0;
            for (const step of workflow.steps) {
                console.log(`\n📋 Executing step: ${step.name}`);
                const stepStartTime = Date.now();
                try {
                    const stepResult = await this.executeStep(step);
                    const stepDuration = Date.now() - stepStartTime;
                    results.push({
                        stepName: step.name,
                        success: stepResult.success,
                        duration: stepDuration,
                        message: stepResult.message,
                        details: stepResult.details
                    });
                    executedSteps++;
                    if (!stepResult.success) {
                        failedSteps++;
                        console.error(`❌ Step failed: ${stepResult.message}`);
                        if (!step.continueOnError) {
                            break;
                        }
                    }
                    else {
                        console.log(`✅ Step completed: ${stepResult.message}`);
                    }
                }
                catch (error) {
                    const stepDuration = Date.now() - stepStartTime;
                    results.push({
                        stepName: step.name,
                        success: false,
                        duration: stepDuration,
                        message: `Step execution failed: ${error}`,
                        details: { error: String(error) }
                    });
                    executedSteps++;
                    failedSteps++;
                    console.error(`❌ Step failed with error: ${error}`);
                    if (!step.continueOnError) {
                        break;
                    }
                }
            }
            const duration = Date.now() - startTime;
            const success = failedSteps === 0;
            const summary = success
                ? `Workflow completed successfully: ${executedSteps} steps executed`
                : `Workflow completed with errors: ${executedSteps} steps executed, ${failedSteps} failed`;
            return {
                workflowName,
                success,
                executedSteps,
                failedSteps,
                results,
                duration,
                summary
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                workflowName,
                success: false,
                executedSteps: 0,
                failedSteps: 1,
                results: [{
                        stepName: 'workflow-initialization',
                        success: false,
                        duration,
                        message: `Workflow execution failed: ${error}`,
                        details: { error: String(error) }
                    }],
                duration,
                summary: `Workflow failed to execute: ${error}`
            };
        }
    }
    /**
     * Execute a single workflow step
     */
    async executeStep(step) {
        switch (step.type) {
            case 'validate':
                return await this.translationManager.validateAll();
            case 'sync':
                const namespaces = step.config.namespaces || ['common', 'errors', 'forms', 'auth'];
                return await this.translationManager.synchronizeAll({ namespaces });
            case 'report':
                const outputPath = step.config.outputPath ||
                    path.join(this.workspaceRoot, `translation-report-${Date.now()}.json`);
                return await this.translationManager.generateReport(outputPath);
            case 'backup':
                // Create manual backup
                const backupName = step.config.name || `workflow-backup-${Date.now()}`;
                await this.createWorkflowBackup(backupName);
                return {
                    success: true,
                    message: `Backup created: ${backupName}`,
                    details: { backupName }
                };
            case 'custom':
                // Execute custom function
                if (step.config.function && typeof step.config.function === 'function') {
                    const result = await step.config.function(this.translationManager, step.config);
                    return result;
                }
                else {
                    throw new Error('Custom step requires a function in config');
                }
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }
    /**
     * Create a workflow
     */
    async createWorkflow(workflow) {
        const workflowPath = path.join(this.workflowsPath, `${workflow.name}.json`);
        if (fs.existsSync(workflowPath)) {
            throw new Error(`Workflow ${workflow.name} already exists`);
        }
        fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
        console.log(`✅ Workflow created: ${workflow.name}`);
    }
    /**
     * Update a workflow
     */
    async updateWorkflow(workflowName, updates) {
        const workflow = await this.loadWorkflow(workflowName);
        const updatedWorkflow = { ...workflow, ...updates };
        const workflowPath = path.join(this.workflowsPath, `${workflowName}.json`);
        fs.writeFileSync(workflowPath, JSON.stringify(updatedWorkflow, null, 2));
        console.log(`✅ Workflow updated: ${workflowName}`);
    }
    /**
     * Delete a workflow
     */
    async deleteWorkflow(workflowName) {
        const workflowPath = path.join(this.workflowsPath, `${workflowName}.json`);
        if (!fs.existsSync(workflowPath)) {
            throw new Error(`Workflow ${workflowName} does not exist`);
        }
        fs.unlinkSync(workflowPath);
        console.log(`✅ Workflow deleted: ${workflowName}`);
    }
    /**
     * List all workflows
     */
    async listWorkflows() {
        const workflowFiles = fs.readdirSync(this.workflowsPath)
            .filter(file => file.endsWith('.json'));
        const workflows = [];
        for (const file of workflowFiles) {
            try {
                const workflow = await this.loadWorkflow(path.basename(file, '.json'));
                workflows.push(workflow);
            }
            catch (error) {
                console.warn(`⚠️  Failed to load workflow ${file}: ${String(error)}`);
            }
        }
        return workflows;
    }
    /**
     * Load a workflow from file
     */
    async loadWorkflow(workflowName) {
        const workflowPath = path.join(this.workflowsPath, `${workflowName}.json`);
        if (!fs.existsSync(workflowPath)) {
            throw new Error(`Workflow ${workflowName} does not exist`);
        }
        const content = fs.readFileSync(workflowPath, 'utf-8');
        return JSON.parse(content);
    }
    /**
     * Create predefined workflows
     */
    async createPredefinedWorkflows() {
        console.log('🔧 Creating predefined workflows...');
        const workflows = [
            {
                name: 'daily-validation',
                description: 'Daily translation validation and reporting',
                enabled: true,
                steps: [
                    {
                        name: 'validate-translations',
                        type: 'validate',
                        config: {},
                        continueOnError: true
                    },
                    {
                        name: 'generate-report',
                        type: 'report',
                        config: {
                            outputPath: path.join(this.workspaceRoot, 'translation-reports', `daily-${new Date().toISOString().split('T')[0]}.json`)
                        },
                        continueOnError: true
                    }
                ]
            },
            {
                name: 'weekly-maintenance',
                description: 'Weekly translation maintenance and synchronization',
                enabled: true,
                steps: [
                    {
                        name: 'create-backup',
                        type: 'backup',
                        config: {
                            name: `weekly-backup-${new Date().toISOString().split('T')[0]}`
                        },
                        continueOnError: false
                    },
                    {
                        name: 'sync-all-namespaces',
                        type: 'sync',
                        config: {
                            namespaces: ['common', 'errors', 'forms', 'auth']
                        },
                        continueOnError: true
                    },
                    {
                        name: 'validate-after-sync',
                        type: 'validate',
                        config: {},
                        continueOnError: true
                    },
                    {
                        name: 'generate-weekly-report',
                        type: 'report',
                        config: {
                            outputPath: path.join(this.workspaceRoot, 'translation-reports', `weekly-${new Date().toISOString().split('T')[0]}.json`)
                        },
                        continueOnError: true
                    }
                ]
            },
            {
                name: 'pre-deployment',
                description: 'Pre-deployment translation validation',
                enabled: true,
                steps: [
                    {
                        name: 'comprehensive-validation',
                        type: 'validate',
                        config: {},
                        continueOnError: false
                    },
                    {
                        name: 'deployment-report',
                        type: 'report',
                        config: {
                            outputPath: path.join(this.workspaceRoot, 'translation-reports', `pre-deployment-${Date.now()}.json`)
                        },
                        continueOnError: false
                    }
                ]
            }
        ];
        for (const workflow of workflows) {
            try {
                await this.createWorkflow(workflow);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('already exists')) {
                    console.log(`⏭️  Workflow ${workflow.name} already exists, skipping...`);
                }
                else {
                    console.error(`❌ Failed to create workflow ${workflow.name}: ${String(error)}`);
                }
            }
        }
        console.log('✅ Predefined workflows setup complete');
    }
    /**
     * Create workflow backup
     */
    async createWorkflowBackup(backupName) {
        const backupDir = path.join(this.workspaceRoot, 'translation-backups', backupName);
        // Create backup directory
        fs.mkdirSync(backupDir, { recursive: true });
        // Copy translation files
        const applications = [
            { name: 'shared-ui', path: 'web/shared-ui/public/locales' },
            { name: 'l4h', path: 'web/l4h/public/locales' },
            { name: 'cannlaw', path: 'web/cannlaw/public/locales' }
        ];
        for (const app of applications) {
            const sourcePath = path.join(this.workspaceRoot, app.path);
            if (fs.existsSync(sourcePath)) {
                const backupPath = path.join(backupDir, app.name);
                this.copyDirectory(sourcePath, backupPath);
            }
        }
        // Copy workflow configurations
        const workflowBackupPath = path.join(backupDir, 'workflows');
        this.copyDirectory(this.workflowsPath, workflowBackupPath);
        console.log(`💾 Workflow backup created: ${backupDir}`);
    }
    /**
     * Copy directory recursively
     */
    copyDirectory(src, dest) {
        if (!fs.existsSync(src))
            return;
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    /**
     * Generate workflow template
     */
    generateWorkflowTemplate(outputPath) {
        const template = {
            name: 'custom-workflow',
            description: 'Custom translation workflow',
            enabled: true,
            steps: [
                {
                    name: 'backup-step',
                    type: 'backup',
                    config: {
                        name: 'custom-backup'
                    },
                    continueOnError: false
                },
                {
                    name: 'validation-step',
                    type: 'validate',
                    config: {},
                    continueOnError: true
                },
                {
                    name: 'sync-step',
                    type: 'sync',
                    config: {
                        namespaces: ['common', 'errors']
                    },
                    continueOnError: true
                },
                {
                    name: 'report-step',
                    type: 'report',
                    config: {
                        outputPath: './custom-report.json'
                    },
                    continueOnError: true
                }
            ]
        };
        fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
        console.log(`📄 Workflow template generated: ${outputPath}`);
    }
}
// CLI execution
if (require.main === module) {
    const manager = new TranslationWorkflowManager();
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('🔄 Translation Workflow Manager');
        console.log('='.repeat(50));
        console.log('');
        console.log('Usage:');
        console.log('  node translation-workflow-manager.ts <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  execute <workflow-name>         Execute a workflow');
        console.log('  list                            List all workflows');
        console.log('  create-predefined               Create predefined workflows');
        console.log('  template <output-file>          Generate workflow template');
        console.log('');
        console.log('Examples:');
        console.log('  node translation-workflow-manager.ts execute daily-validation');
        console.log('  node translation-workflow-manager.ts list');
        console.log('  node translation-workflow-manager.ts create-predefined');
        console.log('  node translation-workflow-manager.ts template custom-workflow.json');
        process.exit(1);
    }
    const command = args[0];
    try {
        switch (command) {
            case 'execute':
                if (args.length < 2) {
                    console.error('Error: Workflow name required');
                    process.exit(1);
                }
                manager.executeWorkflow(args[1])
                    .then(result => {
                    console.log(`\n📊 Workflow Result:`);
                    console.log(`   ${result.success ? '✅' : '❌'} ${result.summary}`);
                    console.log(`   Duration: ${result.duration}ms`);
                    console.log(`   Steps executed: ${result.executedSteps}`);
                    console.log(`   Steps failed: ${result.failedSteps}`);
                    if (result.results.length > 0) {
                        console.log('\n📋 Step Results:');
                        result.results.forEach(step => {
                            console.log(`   ${step.success ? '✅' : '❌'} ${step.stepName}: ${step.message} (${step.duration}ms)`);
                        });
                    }
                    process.exit(result.success ? 0 : 1);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'list':
                manager.listWorkflows()
                    .then(workflows => {
                    console.log('\n📋 Available Workflows:');
                    console.log('='.repeat(50));
                    if (workflows.length === 0) {
                        console.log('No workflows found. Use "create-predefined" to create default workflows.');
                    }
                    else {
                        workflows.forEach(workflow => {
                            const status = workflow.enabled ? '✅ Enabled' : '❌ Disabled';
                            console.log(`\n${workflow.name}`);
                            console.log(`   Description: ${workflow.description}`);
                            console.log(`   Status: ${status}`);
                            console.log(`   Steps: ${workflow.steps.length}`);
                        });
                    }
                    process.exit(0);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'create-predefined':
                manager.createPredefinedWorkflows()
                    .then(() => {
                    console.log('\n✅ Predefined workflows created successfully');
                    process.exit(0);
                })
                    .catch(error => {
                    console.error('Error:', error.message);
                    process.exit(1);
                });
                break;
            case 'template':
                if (args.length < 2) {
                    console.error('Error: Output file path required');
                    process.exit(1);
                }
                manager.generateWorkflowTemplate(args[1]);
                process.exit(0);
                break;
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
export { TranslationWorkflowManager };
