#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface ConsistencyIssue {
  type: 'missing_key' | 'empty_value' | 'placeholder_mismatch' | 'length_variance' | 'format_inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  key: string;
  namespace: string;
  language: string;
  description: string;
  suggestion?: string;
}

interface ConsistencyReport {
  timestamp: string;
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    languagesChecked: number;
    namespacesChecked: number;
  };
  issues: ConsistencyIssue[];
  languageStats: Record<string, {
    totalIssues: number;
    criticalIssues: number;
    completeness: number;
  }>;
  recommendations: string[];
}

interface TranslationFile {
  [key: string]: string | TranslationFile;
}

class TranslationConsistencyChecker {
  private supportedLanguages = [
    'ar-SA', 'bn-BD', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'hi-IN',
    'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
    'ru-RU', 'ta-IN', 'te-IN', 'tl-PH', 'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
  ];

  private baseLanguage = 'en-US';
  private workspaceRoot: string;
  private interpolationPattern = /\{\{[^}]+\}\}/g;
  private rtlLanguages = ['ar-SA', 'ur-PK'];

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Check consistency across all applications and languages
   */
  async checkConsistency(): Promise<ConsistencyReport> {
    console.log('🔍 Starting translation consistency check...');
    
    const issues: ConsistencyIssue[] = [];
    const applications = [
      { name: 'shared-ui', path: 'web/shared-ui/public/locales/shared' },
      { name: 'l4h', path: 'web/l4h/public/locales/l4h' },
      { name: 'cannlaw', path: 'web/cannlaw/public/locales/cannlaw' }
    ];

    for (const app of applications) {
      console.log(`\n📁 Checking ${app.name} consistency...`);
      const appIssues = await this.checkApplicationConsistency(app.path, app.name);
      issues.push(...appIssues);
    }

    return this.generateConsistencyReport(issues);
  }

  /**
   * Check consistency for a specific application
   */
  private async checkApplicationConsistency(localesPath: string, appName: string): Promise<ConsistencyIssue[]> {
    const fullPath = path.join(this.workspaceRoot, localesPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Locales path not found: ${fullPath}`);
      return [];
    }

    const issues: ConsistencyIssue[] = [];
    const baseLanguagePath = path.join(fullPath, this.baseLanguage);
    
    if (!fs.existsSync(baseLanguagePath)) {
      console.error(`❌ Base language (${this.baseLanguage}) not found in ${fullPath}`);
      return [];
    }

    // Get all namespaces
    const namespaces = this.getNamespaces(baseLanguagePath);
    console.log(`   Found ${namespaces.length} namespaces: ${namespaces.join(', ')}`);

    // Load base translations
    const baseTranslations = this.loadAllTranslations(baseLanguagePath, namespaces);

    // Check each language against base
    for (const language of this.supportedLanguages) {
      if (language === this.baseLanguage) continue;

      const languagePath = path.join(fullPath, language);
      if (!fs.existsSync(languagePath)) {
        console.warn(`   ⚠️  Language ${language} directory not found`);
        continue;
      }

      const languageTranslations = this.loadAllTranslations(languagePath, namespaces);
      const languageIssues = this.compareTranslations(
        baseTranslations,
        languageTranslations,
        language,
        appName
      );
      
      issues.push(...languageIssues);
    }

    return issues;
  }

  /**
   * Get all JSON files (namespaces) in a directory
   */
  private getNamespaces(languagePath: string): string[] {
    try {
      const files = fs.readdirSync(languagePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error(`Error reading namespaces from ${languagePath}:`, error);
      return [];
    }
  }

  /**
   * Load all translation files for a language
   */
  private loadAllTranslations(languagePath: string, namespaces: string[]): Record<string, TranslationFile> {
    const translations: Record<string, TranslationFile> = {};
    
    for (const namespace of namespaces) {
      const filePath = path.join(languagePath, `${namespace}.json`);
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          translations[namespace] = JSON.parse(content);
        } else {
          translations[namespace] = {};
        }
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        translations[namespace] = {};
      }
    }
    
    return translations;
  }

  /**
   * Compare translations between base language and target language
   */
  private compareTranslations(
    baseTranslations: Record<string, TranslationFile>,
    targetTranslations: Record<string, TranslationFile>,
    language: string,
    appName: string
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const [namespace, baseTranslation] of Object.entries(baseTranslations)) {
      const targetTranslation = targetTranslations[namespace] || {};
      const namespaceIssues = this.compareNamespace(
        baseTranslation,
        targetTranslation,
        namespace,
        language,
        appName
      );
      issues.push(...namespaceIssues);
    }

    return issues;
  }

  /**
   * Compare a specific namespace between base and target language
   */
  private compareNamespace(
    baseTranslation: TranslationFile,
    targetTranslation: TranslationFile,
    namespace: string,
    language: string,
    appName: string
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const baseFlat = this.flattenTranslation(baseTranslation);
    const targetFlat = this.flattenTranslation(targetTranslation);

    for (const [key, baseValue] of Object.entries(baseFlat)) {
      const targetValue = targetFlat[key];
      const fullNamespace = `${appName}:${namespace}`;

      // Check for missing keys
      if (targetValue === undefined) {
        issues.push({
          type: 'missing_key',
          severity: 'high',
          key,
          namespace: fullNamespace,
          language,
          description: `Missing translation key: ${key}`,
          suggestion: `Add translation for key "${key}" in ${language}`
        });
        continue;
      }

      // Check for empty values
      if (targetValue.trim() === '') {
        issues.push({
          type: 'empty_value',
          severity: 'medium',
          key,
          namespace: fullNamespace,
          language,
          description: `Empty translation value for key: ${key}`,
          suggestion: `Provide translation for key "${key}" in ${language}`
        });
        continue;
      }

      // Check placeholder consistency
      const placeholderIssue = this.checkPlaceholderConsistency(baseValue, targetValue, key, fullNamespace, language);
      if (placeholderIssue) {
        issues.push(placeholderIssue);
      }

      // Check length variance (potential truncation issues)
      const lengthIssue = this.checkLengthVariance(baseValue, targetValue, key, fullNamespace, language);
      if (lengthIssue) {
        issues.push(lengthIssue);
      }

      // Check format consistency
      const formatIssue = this.checkFormatConsistency(baseValue, targetValue, key, fullNamespace, language);
      if (formatIssue) {
        issues.push(formatIssue);
      }
    }

    return issues;
  }

  /**
   * Check if interpolation placeholders match between base and target
   */
  private checkPlaceholderConsistency(
    baseValue: string,
    targetValue: string,
    key: string,
    namespace: string,
    language: string
  ): ConsistencyIssue | null {
    const basePlaceholders = (baseValue.match(this.interpolationPattern) || []).sort();
    const targetPlaceholders = (targetValue.match(this.interpolationPattern) || []).sort();

    if (JSON.stringify(basePlaceholders) !== JSON.stringify(targetPlaceholders)) {
      return {
        type: 'placeholder_mismatch',
        severity: 'critical',
        key,
        namespace,
        language,
        description: `Placeholder mismatch: expected ${basePlaceholders.join(', ')}, found ${targetPlaceholders.join(', ')}`,
        suggestion: `Update placeholders in "${key}" to match: ${basePlaceholders.join(', ')}`
      };
    }

    return null;
  }

  /**
   * Check for significant length differences that might indicate issues
   */
  private checkLengthVariance(
    baseValue: string,
    targetValue: string,
    key: string,
    namespace: string,
    language: string
  ): ConsistencyIssue | null {
    // Skip length check for RTL languages as they may have different character lengths
    if (this.rtlLanguages.includes(language)) {
      return null;
    }

    const baseLength = baseValue.length;
    const targetLength = targetValue.length;
    
    if (baseLength === 0) return null;

    const variance = Math.abs(targetLength - baseLength) / baseLength;
    
    // Flag if translation is more than 200% longer or 50% shorter than base
    if (variance > 2.0) {
      return {
        type: 'length_variance',
        severity: 'medium',
        key,
        namespace,
        language,
        description: `Translation significantly longer than base (${targetLength} vs ${baseLength} characters)`,
        suggestion: `Review translation for "${key}" - may be too verbose or contain extra content`
      };
    } else if (variance > 0.5 && targetLength < baseLength) {
      return {
        type: 'length_variance',
        severity: 'low',
        key,
        namespace,
        language,
        description: `Translation significantly shorter than base (${targetLength} vs ${baseLength} characters)`,
        suggestion: `Review translation for "${key}" - may be missing content or too abbreviated`
      };
    }

    return null;
  }

  /**
   * Check for format consistency (capitalization, punctuation, etc.)
   */
  private checkFormatConsistency(
    baseValue: string,
    targetValue: string,
    key: string,
    namespace: string,
    language: string
  ): ConsistencyIssue | null {
    // Check if base ends with punctuation but target doesn't (or vice versa)
    const basePunctuation = /[.!?:]$/.test(baseValue.trim());
    const targetPunctuation = /[.!?:]$/.test(targetValue.trim());

    if (basePunctuation !== targetPunctuation) {
      return {
        type: 'format_inconsistency',
        severity: 'low',
        key,
        namespace,
        language,
        description: `Punctuation inconsistency: base ${basePunctuation ? 'has' : 'lacks'} ending punctuation, target ${targetPunctuation ? 'has' : 'lacks'} it`,
        suggestion: `Review punctuation consistency for "${key}"`
      };
    }

    return null;
  }

  /**
   * Flatten nested translation object to flat key-value pairs
   */
  private flattenTranslation(obj: TranslationFile, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, this.flattenTranslation(value as TranslationFile, fullKey));
      } else if (typeof value === 'string') {
        flattened[fullKey] = value;
      }
    }
    
    return flattened;
  }

  /**
   * Generate comprehensive consistency report
   */
  private generateConsistencyReport(issues: ConsistencyIssue[]): ConsistencyReport {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    const languagesChecked = new Set(issues.map(i => i.language)).size;
    const namespacesChecked = new Set(issues.map(i => i.namespace)).size;

    // Calculate language statistics
    const languageStats: Record<string, { totalIssues: number; criticalIssues: number; completeness: number }> = {};
    
    for (const language of this.supportedLanguages) {
      const languageIssues = issues.filter(i => i.language === language);
      const criticalCount = languageIssues.filter(i => i.severity === 'critical').length;
      const totalKeys = new Set(issues.map(i => i.key)).size;
      const missingKeys = languageIssues.filter(i => i.type === 'missing_key').length;
      const completeness = totalKeys > 0 ? ((totalKeys - missingKeys) / totalKeys) * 100 : 100;

      languageStats[language] = {
        totalIssues: languageIssues.length,
        criticalIssues: criticalCount,
        completeness: Math.round(completeness * 100) / 100
      };
    }

    const recommendations = this.generateRecommendations(issues, languageStats);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: issues.length,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
        languagesChecked,
        namespacesChecked
      },
      issues: issues.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      languageStats,
      recommendations
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    issues: ConsistencyIssue[],
    languageStats: Record<string, { totalIssues: number; criticalIssues: number; completeness: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`URGENT: Fix ${criticalIssues.length} critical placeholder mismatches immediately`);
    }

    // Languages with most issues
    const problematicLanguages = Object.entries(languageStats)
      .filter(([, stats]) => stats.totalIssues > 10)
      .sort(([, a], [, b]) => b.totalIssues - a.totalIssues)
      .slice(0, 5)
      .map(([lang]) => lang);

    if (problematicLanguages.length > 0) {
      recommendations.push(`Focus on improving these languages: ${problematicLanguages.join(', ')}`);
    }

    // Low completeness languages
    const incompleteLanguages = Object.entries(languageStats)
      .filter(([, stats]) => stats.completeness < 80)
      .map(([lang]) => lang);

    if (incompleteLanguages.length > 0) {
      recommendations.push(`Complete missing translations for: ${incompleteLanguages.join(', ')}`);
    }

    // Namespace-specific issues
    const namespaceIssues = new Map<string, number>();
    issues.forEach(issue => {
      namespaceIssues.set(issue.namespace, (namespaceIssues.get(issue.namespace) || 0) + 1);
    });

    const problematicNamespaces = Array.from(namespaceIssues.entries())
      .filter(([, count]) => count > 20)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([namespace]) => namespace);

    if (problematicNamespaces.length > 0) {
      recommendations.push(`Review and update these namespaces: ${problematicNamespaces.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Save consistency report to file
   */
  async saveReport(report: ConsistencyReport, outputPath?: string): Promise<string> {
    const defaultPath = path.join(this.workspaceRoot, 'translation-consistency-report.json');
    const filePath = outputPath || defaultPath;
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Consistency report saved to: ${filePath}`);
    
    return filePath;
  }

  /**
   * Print summary to console
   */
  printSummary(report: ConsistencyReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TRANSLATION CONSISTENCY CHECK SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Issue Summary:`);
    console.log(`   Total Issues: ${report.summary.totalIssues}`);
    console.log(`   Critical: ${report.summary.criticalIssues}`);
    console.log(`   High: ${report.summary.highIssues}`);
    console.log(`   Medium: ${report.summary.mediumIssues}`);
    console.log(`   Low: ${report.summary.lowIssues}`);
    console.log(`   Languages Checked: ${report.summary.languagesChecked}`);
    console.log(`   Namespaces Checked: ${report.summary.namespacesChecked}`);

    // Show worst performing languages
    const worstLanguages = Object.entries(report.languageStats)
      .filter(([, stats]) => stats.totalIssues > 0)
      .sort(([, a], [, b]) => b.totalIssues - a.totalIssues)
      .slice(0, 10);

    if (worstLanguages.length > 0) {
      console.log(`\n⚠️  Languages with Most Issues:`);
      worstLanguages.forEach(([language, stats]) => {
        console.log(`   ${language}: ${stats.totalIssues} issues (${stats.criticalIssues} critical, ${stats.completeness}% complete)`);
      });
    }

    // Show critical issues
    const criticalIssues = report.issues.filter(i => i.severity === 'critical').slice(0, 5);
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues (Top 5):`);
      criticalIssues.forEach(issue => {
        console.log(`   ${issue.language} - ${issue.namespace} - ${issue.key}: ${issue.description}`);
      });
    }

    // Show recommendations
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// CLI execution
if (require.main === module) {
  const checker = new TranslationConsistencyChecker();
  
  checker.checkConsistency()
    .then(report => {
      checker.printSummary(report);
      return checker.saveReport(report);
    })
    .then(filePath => {
      console.log(`\n✅ Consistency check complete! Report saved to: ${filePath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Consistency check failed:', error);
      process.exit(1);
    });
}

export { TranslationConsistencyChecker };
export type { ConsistencyIssue, ConsistencyReport };