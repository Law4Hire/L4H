#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface KeyMigration {
  oldKey: string;
  newKey: string;
  namespace?: string;
  targetNamespace?: string;
  applications?: string[];
  preserveOld?: boolean;
}

interface MigrationResult {
  success: boolean;
  filesUpdated: string[];
  codeFilesUpdated: string[];
  errors: string[];
  summary: string;
}

interface ApplicationConfig {
  name: string;
  localesPath: string;
  srcPath: string;
  namespaces: string[];
}

interface CodeFileUpdate {
  filePath: string;
  oldPattern: string;
  newPattern: string;
  occurrences: number;
}

class TranslationKeyMigrator {
  private workspaceRoot: string;
  
  private supportedLanguages = [
    'ar-SA', 'bn-BD', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'hi-IN',
    'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
    'ru-RU', 'ta-IN', 'te-IN', 'tl-PH', 'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
  ];

  private applications: ApplicationConfig[] = [
    {
      name: 'shared-ui',
      localesPath: 'web/shared-ui/public/locales/shared',
      srcPath: 'web/shared-ui/src',
      namespaces: ['common', 'errors', 'forms', 'auth']
    },
    {
      name: 'l4h',
      localesPath: 'web/l4h/public/locales/l4h',
      srcPath: 'web/l4h/src',
      namespaces: ['interview', 'dashboard', 'visa-library', 'pricing']
    },
    {
      name: 'cannlaw',
      localesPath: 'web/cannlaw/public/locales/cannlaw',
      srcPath: 'web/cannlaw/src',
      namespaces: ['legal', 'billing', 'clients', 'cases']
    }
  ];

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Migrate a single translation key across all applications
   */
  async migrateKey(migration: KeyMigration): Promise<MigrationResult> {
    console.log(`🔄 Migrating translation key: ${migration.oldKey} → ${migration.newKey}`);

    const filesUpdated: string[] = [];
    const codeFilesUpdated: string[] = [];
    const errors: string[] = [];

    // Create backup before migration
    await this.createBackup();

    // Determine target applications
    const targetApps = migration.applications 
      ? this.applications.filter(app => migration.applications!.includes(app.name))
      : this.applications;

    // Migrate translation files
    for (const app of targetApps) {
      try {
        const result = await this.migrateTranslationFiles(migration, app);
        filesUpdated.push(...result.filesUpdated);
        errors.push(...result.errors);
      } catch (error) {
        errors.push(`Failed to migrate translation files in ${app.name}: ${error}`);
      }
    }

    // Migrate code files
    for (const app of targetApps) {
      try {
        const result = await this.migrateCodeFiles(migration, app);
        codeFilesUpdated.push(...result.codeFilesUpdated);
        errors.push(...result.errors);
      } catch (error) {
        errors.push(`Failed to migrate code files in ${app.name}: ${error}`);
      }
    }

    const success = errors.length === 0;
    const summary = success
      ? `Successfully migrated ${filesUpdated.length} translation files and ${codeFilesUpdated.length} code files`
      : `Migration completed with ${errors.length} errors. Updated ${filesUpdated.length} translation files and ${codeFilesUpdated.length} code files`;

    return {
      success,
      filesUpdated,
      codeFilesUpdated,
      errors,
      summary
    };
  }

  /**
   * Bulk migrate multiple keys
   */
  async bulkMigrateKeys(migrations: KeyMigration[]): Promise<MigrationResult> {
    console.log(`🔄 Starting bulk migration of ${migrations.length} keys...`);

    const allFilesUpdated: string[] = [];
    const allCodeFilesUpdated: string[] = [];
    const allErrors: string[] = [];

    // Create backup before bulk operations
    await this.createBackup();

    for (const migration of migrations) {
      console.log(`\n📝 Processing: ${migration.oldKey} → ${migration.newKey}`);
      
      try {
        const result = await this.migrateKey(migration);
        allFilesUpdated.push(...result.filesUpdated);
        allCodeFilesUpdated.push(...result.codeFilesUpdated);
        allErrors.push(...result.errors);
      } catch (error) {
        allErrors.push(`Failed to migrate ${migration.oldKey}: ${error}`);
      }
    }

    const success = allErrors.length === 0;
    const summary = success
      ? `Successfully completed bulk migration of ${migrations.length} keys`
      : `Bulk migration completed with ${allErrors.length} errors`;

    return {
      success,
      filesUpdated: [...new Set(allFilesUpdated)], // Remove duplicates
      codeFilesUpdated: [...new Set(allCodeFilesUpdated)],
      errors: allErrors,
      summary
    };
  }

  /**
   * Migrate translation files for a specific application
   */
  private async migrateTranslationFiles(
    migration: KeyMigration,
    app: ApplicationConfig
  ): Promise<{ filesUpdated: string[]; errors: string[] }> {
    const filesUpdated: string[] = [];
    const errors: string[] = [];

    const sourceNamespace = migration.namespace || 'common';
    const targetNamespace = migration.targetNamespace || sourceNamespace;

    // Skip if namespace doesn't exist in this app
    if (!app.namespaces.includes(sourceNamespace) || !app.namespaces.includes(targetNamespace)) {
      return { filesUpdated, errors };
    }

    for (const language of this.supportedLanguages) {
      try {
        const sourceFilePath = path.join(this.workspaceRoot, app.localesPath, language, `${sourceNamespace}.json`);
        const targetFilePath = path.join(this.workspaceRoot, app.localesPath, language, `${targetNamespace}.json`);

        // Skip if source file doesn't exist
        if (!fs.existsSync(sourceFilePath)) {
          continue;
        }

        // Load source file
        const sourceContent = JSON.parse(fs.readFileSync(sourceFilePath, 'utf-8'));
        const translationValue = this.getNestedValue(sourceContent, migration.oldKey);

        if (translationValue === undefined) {
          continue; // Key doesn't exist in this file
        }

        // Load or create target file
        let targetContent: any = {};
        if (fs.existsSync(targetFilePath)) {
          targetContent = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'));
        } else {
          // Create directory if it doesn't exist
          const targetDir = path.dirname(targetFilePath);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
        }

        // Set new key in target file
        this.setNestedValue(targetContent, migration.newKey, translationValue);
        fs.writeFileSync(targetFilePath, JSON.stringify(targetContent, null, 2));

        // Remove old key if not preserving and different namespace
        if (!migration.preserveOld && sourceNamespace === targetNamespace) {
          this.deleteNestedValue(sourceContent, migration.oldKey);
          fs.writeFileSync(sourceFilePath, JSON.stringify(sourceContent, null, 2));
        }

        filesUpdated.push(targetFilePath);
        console.log(`   ✅ Updated ${language}/${targetNamespace}.json`);

      } catch (error) {
        errors.push(`Failed to migrate ${language}/${sourceNamespace}.json: ${error}`);
      }
    }

    return { filesUpdated, errors };
  }

  /**
   * Migrate code files for a specific application
   */
  private async migrateCodeFiles(
    migration: KeyMigration,
    app: ApplicationConfig
  ): Promise<{ codeFilesUpdated: string[]; errors: string[] }> {
    const codeFilesUpdated: string[] = [];
    const errors: string[] = [];

    try {
      const srcPath = path.join(this.workspaceRoot, app.srcPath);
      
      if (!fs.existsSync(srcPath)) {
        return { codeFilesUpdated, errors };
      }

      // Find all TypeScript and JavaScript files
      const pattern = path.join(srcPath, '**/*.{ts,tsx,js,jsx}').replace(/\\/g, '/');
      const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'] });

      for (const file of files) {
        try {
          const updates = await this.updateCodeFile(file, migration);
          if (updates.length > 0) {
            codeFilesUpdated.push(file);
            console.log(`   ✅ Updated ${path.relative(this.workspaceRoot, file)} (${updates.length} occurrences)`);
          }
        } catch (error) {
          errors.push(`Failed to update ${file}: ${error}`);
        }
      }

    } catch (error) {
      errors.push(`Failed to scan code files in ${app.name}: ${error}`);
    }

    return { codeFilesUpdated, errors };
  }

  /**
   * Update a single code file
   */
  private async updateCodeFile(filePath: string, migration: KeyMigration): Promise<CodeFileUpdate[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    let updatedContent = content;
    const updates: CodeFileUpdate[] = [];

    // Patterns to match translation key usage
    const patterns = [
      // t('key') or t("key")
      {
        regex: new RegExp(`\\bt\\s*\\(\\s*['"\`]${this.escapeRegex(migration.oldKey)}['"\`]\\s*\\)`, 'g'),
        replacement: `t('${migration.newKey}')`
      },
      // t('key', options) or t("key", options)
      {
        regex: new RegExp(`\\bt\\s*\\(\\s*['"\`]${this.escapeRegex(migration.oldKey)}['"\`]\\s*,`, 'g'),
        replacement: `t('${migration.newKey}',`
      },
      // useTranslation hook with specific key
      {
        regex: new RegExp(`['"\`]${this.escapeRegex(migration.oldKey)}['"\`]`, 'g'),
        replacement: `'${migration.newKey}'`
      }
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
        updates.push({
          filePath,
          oldPattern: pattern.regex.source,
          newPattern: pattern.replacement,
          occurrences: matches.length
        });
      }
    }

    // Write updated content if changes were made
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent);
    }

    return updates;
  }

  /**
   * Create backup of all translation and code files
   */
  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.workspaceRoot, `translation-backups/migration-${timestamp}`);

    console.log(`💾 Creating backup: ${backupDir}`);

    for (const app of this.applications) {
      const appLocalesPath = path.join(this.workspaceRoot, app.localesPath);
      const appSrcPath = path.join(this.workspaceRoot, app.srcPath);

      if (fs.existsSync(appLocalesPath)) {
        const backupLocalesPath = path.join(backupDir, app.name, 'locales');
        this.copyDirectory(appLocalesPath, backupLocalesPath);
      }

      if (fs.existsSync(appSrcPath)) {
        const backupSrcPath = path.join(backupDir, app.name, 'src');
        this.copyDirectory(appSrcPath, backupSrcPath);
      }
    }

    console.log(`✅ Backup created successfully`);
  }

  /**
   * Copy directory recursively
   */
  private copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(src)) return;

    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Utility methods for nested object manipulation
   */
  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  private getNestedValue(obj: any, key: string): any {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private deleteNestedValue(obj: any, key: string): boolean {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        return false;
      }
      current = current[k];
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey in current) {
      delete current[lastKey];
      return true;
    }

    return false;
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Load migrations from JSON file
   */
  async loadMigrationsFromFile(filePath: string): Promise<KeyMigration[]> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migrations file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const migrations = JSON.parse(content);

    if (!Array.isArray(migrations)) {
      throw new Error('Migrations file must contain an array of migration objects');
    }

    // Validate migration objects
    for (const migration of migrations) {
      if (!migration.oldKey || !migration.newKey) {
        throw new Error('Each migration must have oldKey and newKey properties');
      }
    }

    return migrations;
  }

  /**
   * Generate migration template file
   */
  generateMigrationTemplate(outputPath: string): void {
    const template: KeyMigration[] = [
      {
        oldKey: 'old.translation.key',
        newKey: 'new.translation.key',
        namespace: 'common',
        targetNamespace: 'common',
        applications: ['shared-ui', 'l4h'],
        preserveOld: false
      },
      {
        oldKey: 'another.old.key',
        newKey: 'another.new.key',
        namespace: 'errors',
        targetNamespace: 'forms',
        applications: ['l4h'],
        preserveOld: true
      }
    ];

    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
    console.log(`📄 Migration template generated: ${outputPath}`);
  }

  /**
   * Analyze translation key usage across applications
   */
  async analyzeKeyUsage(key: string): Promise<{
    translationFiles: string[];
    codeFiles: string[];
    totalOccurrences: number;
  }> {
    console.log(`🔍 Analyzing usage of key: ${key}`);

    const translationFiles: string[] = [];
    const codeFiles: string[] = [];
    let totalOccurrences = 0;

    // Check translation files
    for (const app of this.applications) {
      const appLocalesPath = path.join(this.workspaceRoot, app.localesPath);
      
      if (!fs.existsSync(appLocalesPath)) continue;

      for (const language of this.supportedLanguages) {
        for (const namespace of app.namespaces) {
          const filePath = path.join(appLocalesPath, language, `${namespace}.json`);
          
          if (fs.existsSync(filePath)) {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (this.getNestedValue(content, key) !== undefined) {
              translationFiles.push(filePath);
            }
          }
        }
      }
    }

    // Check code files
    for (const app of this.applications) {
      const srcPath = path.join(this.workspaceRoot, app.srcPath);
      
      if (!fs.existsSync(srcPath)) continue;

      const pattern = path.join(srcPath, '**/*.{ts,tsx,js,jsx}').replace(/\\/g, '/');
      const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'] });

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const regex = new RegExp(`['"\`]${this.escapeRegex(key)}['"\`]`, 'g');
        const matches = content.match(regex);
        
        if (matches) {
          codeFiles.push(file);
          totalOccurrences += matches.length;
        }
      }
    }

    return {
      translationFiles: [...new Set(translationFiles)],
      codeFiles: [...new Set(codeFiles)],
      totalOccurrences
    };
  }
}

// CLI execution
if (require.main === module) {
  const migrator = new TranslationKeyMigrator();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node translation-key-migrator.ts <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  migrate <oldKey> <newKey> [namespace]    Migrate a single key');
    console.log('  bulk <file>                              Bulk migrate from file');
    console.log('  analyze <key>                            Analyze key usage');
    console.log('  template <file>                          Generate migration template');
    console.log('');
    console.log('Options:');
    console.log('  --preserve                               Preserve old key');
    console.log('  --apps <app1,app2>                       Target specific applications');
    console.log('  --target-namespace <namespace>           Target different namespace');
    console.log('');
    console.log('Examples:');
    console.log('  node translation-key-migrator.ts migrate old.key new.key common');
    console.log('  node translation-key-migrator.ts bulk migrations.json');
    console.log('  node translation-key-migrator.ts analyze common.loading');
    console.log('  node translation-key-migrator.ts template migrations-template.json');
    process.exit(1);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'migrate':
        if (args.length < 3) {
          console.error('Error: oldKey and newKey required for migrate command');
          process.exit(1);
        }
        
        const migration: KeyMigration = {
          oldKey: args[1],
          newKey: args[2],
          namespace: args[3] || 'common',
          preserveOld: args.includes('--preserve'),
          applications: args.includes('--apps') 
            ? args[args.indexOf('--apps') + 1]?.split(',')
            : undefined,
          targetNamespace: args.includes('--target-namespace')
            ? args[args.indexOf('--target-namespace') + 1]
            : undefined
        };

        migrator.migrateKey(migration)
          .then(result => {
            console.log(`\n${result.success ? '✅' : '❌'} ${result.summary}`);
            if (result.errors.length > 0) {
              console.log('\nErrors:');
              result.errors.forEach(error => console.log(`  ❌ ${error}`));
            }
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
          });
        break;

      case 'bulk':
        if (args.length < 2) {
          console.error('Error: file path required for bulk command');
          process.exit(1);
        }
        
        migrator.loadMigrationsFromFile(args[1])
          .then(migrations => migrator.bulkMigrateKeys(migrations))
          .then(result => {
            console.log(`\n📊 ${result.summary}`);
            if (result.errors.length > 0) {
              console.log('\nErrors:');
              result.errors.forEach(error => console.log(`  ❌ ${error}`));
            }
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
          });
        break;

      case 'analyze':
        if (args.length < 2) {
          console.error('Error: key required for analyze command');
          process.exit(1);
        }
        
        migrator.analyzeKeyUsage(args[1])
          .then(result => {
            console.log(`\n📊 Analysis Results for "${args[1]}":`);
            console.log(`   Translation files: ${result.translationFiles.length}`);
            console.log(`   Code files: ${result.codeFiles.length}`);
            console.log(`   Total occurrences: ${result.totalOccurrences}`);
            
            if (result.translationFiles.length > 0) {
              console.log('\n📄 Translation files:');
              result.translationFiles.forEach(file => console.log(`   ${file}`));
            }
            
            if (result.codeFiles.length > 0) {
              console.log('\n💻 Code files:');
              result.codeFiles.forEach(file => console.log(`   ${file}`));
            }
            
            process.exit(0);
          })
          .catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
          });
        break;

      case 'template':
        if (args.length < 2) {
          console.error('Error: output file path required for template command');
          process.exit(1);
        }
        
        migrator.generateMigrationTemplate(args[1]);
        process.exit(0);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export type { KeyMigration, MigrationResult, ApplicationConfig, CodeFileUpdate };
export { TranslationKeyMigrator };