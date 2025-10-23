import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Global teardown for multilingual e2e tests
 * 
 * This teardown:
 * - Generates comprehensive test reports
 * - Cleans up test artifacts
 * - Provides performance analysis
 * - Creates recommendations for improvements
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running multilingual e2e test teardown...');

  try {
    // Generate comprehensive test report
    await generateMultilingualTestReport();
    
    // Clean up temporary test data
    await cleanupTestArtifacts();
    
    // Analyze performance metrics
    await analyzePerformanceMetrics();
    
    console.log('✅ Multilingual e2e test teardown complete');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  }
}

async function generateMultilingualTestReport(): Promise<void> {
  console.log('📊 Generating multilingual test report...');
  
  try {
    const reportDir = 'test-results/multilingual-reports';
    await fs.mkdir(reportDir, { recursive: true });
    
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Multilingual E2E Tests',
      environment: {
        baseURL: process.env.BASE_URL || 'http://localhost:5173',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      supportedLanguages: [
        'en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA',
        'zh-CN', 'hi-IN', 'ja-JP', 'ur-PK', 'ru-RU'
      ],
      testCategories: [
        'User Journey Tests',
        'Language Switching Workflow Tests',
        'RTL Language User Experience Tests',
        'Multilingual Accessibility Tests'
      ],
      performanceBaseline: {
        baselineLoadTime: process.env.MULTILINGUAL_BASELINE_LOAD_TIME || 'N/A'
      },
      recommendations: [
        'Ensure all translation files are complete and validated',
        'Test language switching performance regularly',
        'Validate RTL layout in all supported browsers',
        'Monitor accessibility compliance across all languages',
        'Implement automated translation completeness checks'
      ]
    };
    
    const reportPath = path.join(reportDir, 'multilingual-test-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Test report generated: ${reportPath}`);
    
  } catch (error) {
    console.warn(`⚠️ Failed to generate test report: ${error}`);
  }
}

async function cleanupTestArtifacts(): Promise<void> {
  console.log('🧹 Cleaning up test artifacts...');
  
  try {
    const artifactsDir = 'test-results/multilingual-artifacts';
    
    // Check if artifacts directory exists
    try {
      await fs.access(artifactsDir);
    } catch {
      console.log('📁 No artifacts directory found, skipping cleanup');
      return;
    }
    
    // Get list of artifact files
    const files = await fs.readdir(artifactsDir);
    const oldFiles = [];
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    for (const file of files) {
      const filePath = path.join(artifactsDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        oldFiles.push(filePath);
      }
    }
    
    // Remove old files
    for (const filePath of oldFiles) {
      await fs.unlink(filePath);
    }
    
    if (oldFiles.length > 0) {
      console.log(`🗑️ Cleaned up ${oldFiles.length} old artifact files`);
    } else {
      console.log('✨ No old artifacts to clean up');
    }
    
  } catch (error) {
    console.warn(`⚠️ Failed to cleanup artifacts: ${error}`);
  }
}

async function analyzePerformanceMetrics(): Promise<void> {
  console.log('⚡ Analyzing performance metrics...');
  
  try {
    const resultsPath = 'test-results/multilingual-results.json';
    
    // Check if results file exists
    try {
      await fs.access(resultsPath);
    } catch {
      console.log('📊 No results file found, skipping performance analysis');
      return;
    }
    
    const resultsContent = await fs.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(resultsContent);
    
    const performanceMetrics = {
      totalTests: results.stats?.total || 0,
      passedTests: results.stats?.passed || 0,
      failedTests: results.stats?.failed || 0,
      skippedTests: results.stats?.skipped || 0,
      duration: results.stats?.duration || 0,
      averageTestDuration: 0,
      languageSpecificMetrics: {},
      recommendations: []
    };
    
    if (performanceMetrics.totalTests > 0) {
      performanceMetrics.averageTestDuration = performanceMetrics.duration / performanceMetrics.totalTests;
    }
    
    // Analyze test results for language-specific patterns
    if (results.suites) {
      for (const suite of results.suites) {
        if (suite.title.includes('Language') || suite.title.includes('Multilingual')) {
          const suiteName = suite.title;
          const suiteMetrics = {
            tests: suite.tests?.length || 0,
            duration: suite.duration || 0,
            passed: suite.tests?.filter((t: any) => t.status === 'passed').length || 0,
            failed: suite.tests?.filter((t: any) => t.status === 'failed').length || 0
          };
          
          (performanceMetrics.languageSpecificMetrics as any)[suiteName] = suiteMetrics;
        }
      }
    }
    
    // Generate recommendations based on metrics
    if (performanceMetrics.failedTests > 0) {
      performanceMetrics.recommendations.push(
        `${performanceMetrics.failedTests} tests failed - review language-specific implementations`
      );
    }
    
    if (performanceMetrics.averageTestDuration > 30000) {
      performanceMetrics.recommendations.push(
        'Average test duration is high - consider optimizing translation loading'
      );
    }
    
    const successRate = (performanceMetrics.passedTests / performanceMetrics.totalTests) * 100;
    if (successRate < 95) {
      performanceMetrics.recommendations.push(
        `Test success rate is ${successRate.toFixed(1)}% - aim for >95% for production readiness`
      );
    }
    
    // Save performance analysis
    const analysisPath = 'test-results/multilingual-reports/performance-analysis.json';
    await fs.mkdir(path.dirname(analysisPath), { recursive: true });
    await fs.writeFile(analysisPath, JSON.stringify(performanceMetrics, null, 2));
    
    console.log(`📈 Performance analysis saved: ${analysisPath}`);
    console.log(`📊 Test Summary: ${performanceMetrics.passedTests}/${performanceMetrics.totalTests} passed (${successRate.toFixed(1)}%)`);
    
    if (performanceMetrics.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      performanceMetrics.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
  } catch (error) {
    console.warn(`⚠️ Failed to analyze performance metrics: ${error}`);
  }
}

export default globalTeardown;