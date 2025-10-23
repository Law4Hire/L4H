#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Translation Audit Script
 * Detects English text in non-English translation files
 */

// Common English words that shouldn't appear in other languages
const ENGLISH_INDICATORS = [
  // Common words
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'among', 'this', 'that', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'cannot', 'not', 'no', 'yes', 'please', 'thank',
  'thanks', 'welcome', 'hello', 'hi', 'goodbye', 'bye', 'sorry', 'excuse', 'help', 'support',
  
  // Application-specific terms
  'login', 'logout', 'password', 'username', 'email', 'phone', 'address', 'name', 'first',
  'last', 'middle', 'submit', 'cancel', 'save', 'delete', 'edit', 'update', 'create', 'new',
  'search', 'filter', 'sort', 'page', 'next', 'previous', 'back', 'home', 'dashboard',
  'profile', 'settings', 'account', 'user', 'admin', 'client', 'case', 'document', 'file',
  'upload', 'download', 'print', 'export', 'import', 'report', 'billing', 'invoice',
  'payment', 'amount', 'total', 'date', 'time', 'status', 'active', 'inactive', 'pending',
  'approved', 'rejected', 'completed', 'error', 'success', 'warning', 'info', 'message',
  'notification', 'alert', 'confirm', 'confirmation', 'required', 'optional', 'invalid',
  'valid', 'loading', 'processing', 'please wait', 'try again', 'contact us'
];

// English sentence patterns
const ENGLISH_PATTERNS = [
  /\b(the|a|an)\s+\w+/i,
  /\b(is|are|was|were)\s+\w+/i,
  /\b(have|has|had)\s+\w+/i,
  /\b(will|would|could|should)\s+\w+/i,
  /\b(please|thank you|thanks)\b/i,
  /\b(error|success|warning|info):/i,
  /\b(click|select|choose|enter)\s+\w+/i,
];

class TranslationAuditor {
  constructor() {
    this.issues = [];
    this.stats = {
      filesScanned: 0,
      issuesFound: 0,
      languagesAudited: new Set()
    };
  }

  /**
   * Scan all translation directories
   */
  async auditAllTranslations() {
    console.log('🔍 Starting Translation Audit...\n');
    
    const translationDirs = [
      'web/l4h/public/locales',
      'web/cannlaw/public/locales', 
      'web/shared-ui/public/locales'
    ];

    for (const dir of translationDirs) {
      if (fs.existsSync(dir)) {
        await this.scanDirectory(dir);
      }
    }

    this.generateReport();
  }

  /**
   * Recursively scan directory for translation files
   */
  async scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip en-US directories (these should contain English)
        if (!item.includes('en-US') && !item.includes('en-CA')) {
          await this.scanDirectory(fullPath);
        }
      } else if (item.endsWith('.json')) {
        await this.auditTranslationFile(fullPath);
      }
    }
  }

  /**
   * Audit individual translation file
   */
  async auditTranslationFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const translations = JSON.parse(content);
      
      // Extract language code from path
      const pathParts = filePath.split(path.sep);
      const langCode = pathParts.find(part => /^[a-z]{2}-[A-Z]{2}$/.test(part));
      
      if (!langCode || langCode.startsWith('en-')) {
        return; // Skip English files
      }

      this.stats.filesScanned++;
      this.stats.languagesAudited.add(langCode);
      
      console.log(`Scanning: ${filePath}`);
      
      this.auditTranslationObject(translations, filePath, langCode);
      
    } catch (error) {
      this.addIssue(filePath, 'FILE_ERROR', `Cannot parse JSON: ${error.message}`);
    }
  }

  /**
   * Recursively audit translation object
   */
  auditTranslationObject(obj, filePath, langCode, keyPath = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = keyPath ? `${keyPath}.${key}` : key;
      
      if (typeof value === 'string') {
        this.checkTranslationValue(value, filePath, langCode, currentPath);
      } else if (typeof value === 'object' && value !== null) {
        this.auditTranslationObject(value, filePath, langCode, currentPath);
      }
    }
  }

  /**
   * Check individual translation value for English content
   */
  checkTranslationValue(value, filePath, langCode, keyPath) {
    const issues = [];
    
    // Skip empty values and interpolation-only strings
    if (!value.trim() || /^{{.*}}$/.test(value.trim())) {
      return;
    }

    // Check for English words
    const words = value.toLowerCase().split(/\s+/);
    const englishWords = words.filter(word => 
      ENGLISH_INDICATORS.includes(word.replace(/[^\w]/g, ''))
    );
    
    if (englishWords.length > 0) {
      issues.push({
        type: 'ENGLISH_WORDS',
        details: `Contains English words: ${englishWords.join(', ')}`
      });
    }

    // Check for English sentence patterns
    for (const pattern of ENGLISH_PATTERNS) {
      if (pattern.test(value)) {
        issues.push({
          type: 'ENGLISH_PATTERN',
          details: `Matches English pattern: ${pattern.source}`
        });
        break;
      }
    }

    // Check for suspicious exact matches (likely copy-paste from English)
    if (this.isSuspiciouslyEnglish(value)) {
      issues.push({
        type: 'SUSPICIOUS_ENGLISH',
        details: 'Appears to be untranslated English text'
      });
    }

    // Report issues
    for (const issue of issues) {
      this.addIssue(filePath, issue.type, issue.details, keyPath, value);
    }
  }

  /**
   * Detect suspiciously English-looking text
   */
  isSuspiciouslyEnglish(text) {
    // Check for common English phrases
    const englishPhrases = [
      'please enter', 'click here', 'try again', 'contact us', 'learn more',
      'get started', 'sign up', 'log in', 'forgot password', 'remember me',
      'terms of service', 'privacy policy', 'all rights reserved'
    ];
    
    const lowerText = text.toLowerCase();
    return englishPhrases.some(phrase => lowerText.includes(phrase));
  }

  /**
   * Add issue to the issues list
   */
  addIssue(filePath, type, details, keyPath = '', value = '') {
    this.issues.push({
      file: filePath,
      type,
      details,
      key: keyPath,
      value: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
      severity: this.getSeverity(type)
    });
    this.stats.issuesFound++;
  }

  /**
   * Get severity level for issue type
   */
  getSeverity(type) {
    switch (type) {
      case 'SUSPICIOUS_ENGLISH':
        return 'HIGH';
      case 'ENGLISH_WORDS':
        return 'MEDIUM';
      case 'ENGLISH_PATTERN':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TRANSLATION AUDIT REPORT');
    console.log('='.repeat(80));
    
    // Summary statistics
    console.log('\n📈 SUMMARY:');
    console.log(`Files Scanned: ${this.stats.filesScanned}`);
    console.log(`Languages Audited: ${Array.from(this.stats.languagesAudited).join(', ')}`);
    console.log(`Total Issues Found: ${this.stats.issuesFound}`);
    
    // Group issues by severity
    const issuesBySeverity = this.groupBy(this.issues, 'severity');
    
    console.log('\n🚨 ISSUES BY SEVERITY:');
    for (const [severity, issues] of Object.entries(issuesBySeverity)) {
      console.log(`${severity}: ${issues.length} issues`);
    }
    
    // Group issues by file
    const issuesByFile = this.groupBy(this.issues, 'file');
    
    console.log('\n📁 ISSUES BY FILE:');
    for (const [file, issues] of Object.entries(issuesByFile)) {
      console.log(`\n${file} (${issues.length} issues):`);
      
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. [${issue.severity}] ${issue.type}`);
        console.log(`     Key: ${issue.key}`);
        console.log(`     Value: "${issue.value}"`);
        console.log(`     Issue: ${issue.details}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.stats.issuesFound === 0) {
      console.log('✅ No issues found! Your translations look good.');
    } else {
      console.log('1. Review HIGH severity issues first - these are likely untranslated English text');
      console.log('2. Check MEDIUM severity issues for potential translation problems');
      console.log('3. Consider using professional translation services for critical content');
      console.log('4. Implement translation validation in your CI/CD pipeline');
    }
    
    // Generate JSON report for programmatic use
    this.generateJSONReport();
  }

  /**
   * Generate JSON report file
   */
  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        filesScanned: this.stats.filesScanned,
        languagesAudited: Array.from(this.stats.languagesAudited),
        totalIssues: this.stats.issuesFound
      },
      issues: this.issues
    };
    
    const reportPath = 'translation-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed JSON report saved to: ${reportPath}`);
  }

  /**
   * Group array by property
   */
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new TranslationAuditor();
  auditor.auditAllTranslations().catch(console.error);
}

module.exports = TranslationAuditor;