import React, { useState } from 'react';
import { LanguageSwitchingTest } from '../../../shared-ui/src/components/LanguageSwitchingTest';
import { TranslationFeedbackWidget } from '../../../shared-ui/src/components/TranslationFeedbackWidget';
import { TranslationMonitoringDashboard } from '../../../shared-ui/src/components/TranslationMonitoringDashboard';
import { SUPPORTED_LANGUAGES, CULTURE_NAMES, isRTL } from '../../../shared-ui/src/i18n-config';

interface TestResult {
  language: string;
  success: boolean;
  loadTime: number;
  errors: string[];
  translationSamples: Record<string, string>;
  rtlDetected: boolean;
  directionApplied: boolean;
}

export const LanguageTestPage: React.FC = () => {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleTestComplete = (results: TestResult[]) => {
    setTestResults(results);
    console.log('Language test completed:', results);
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      setSelectedLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `language-test-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const generateReport = () => {
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;
    const averageLoadTime = testResults.length > 0 
      ? testResults.reduce((sum, r) => sum + r.loadTime, 0) / testResults.length 
      : 0;

    const failedLanguages = testResults.filter(r => !r.success);
    const slowLanguages = testResults.filter(r => r.loadTime > 3000);
    const rtlLanguages = testResults.filter(r => r.rtlDetected);

    return {
      summary: {
        totalLanguages: totalCount,
        successfulLanguages: successCount,
        failedLanguages: failedLanguages.length,
        successRate: totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : '0',
        averageLoadTime: Math.round(averageLoadTime),
      },
      issues: {
        failed: failedLanguages.map(r => ({ language: r.language, errors: r.errors })),
        slow: slowLanguages.map(r => ({ language: r.language, loadTime: r.loadTime })),
      },
      rtl: {
        count: rtlLanguages.length,
        languages: rtlLanguages.map(r => r.language),
        allWorking: rtlLanguages.every(r => r.directionApplied),
      }
    };
  };

  const report = testResults.length > 0 ? generateReport() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('test.language_testing', 'Language Testing Suite')}
              </h1>
              <p className="text-gray-600">
                {t('test.description', 'Comprehensive testing for multilingual functionality')}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>
                    {CULTURE_NAMES[lang] || lang} {isRTL(lang) ? '(RTL)' : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowMonitoring(!showMonitoring)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                {showMonitoring ? 'Hide Monitoring' : 'Show Monitoring'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Language Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('test.current_language', 'Current Language Status')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Language</div>
              <div className="text-lg font-bold text-blue-900">{i18n.language}</div>
              <div className="text-sm text-blue-700">{CULTURE_NAMES[i18n.language]}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Direction</div>
              <div className="text-lg font-bold text-green-900">
                {document.documentElement.dir || 'ltr'}
              </div>
              <div className="text-sm text-green-700">
                {isRTL(i18n.language) ? 'Right-to-Left' : 'Left-to-Right'}
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Loaded Namespaces</div>
              <div className="text-lg font-bold text-yellow-900">
                {Object.keys(i18n.store.data[i18n.language] || {}).length}
              </div>
              <div className="text-sm text-yellow-700">Available</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Sample Text</div>
              <div className="text-lg font-bold text-purple-900" dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>
                {t('common.welcome', 'Welcome')}
              </div>
              <div className="text-sm text-purple-700">Translation Test</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('test.navigation_test', 'Navigation Menu Test')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { key: 'navigation.home', fallback: 'Home' },
              { key: 'navigation.about', fallback: 'About' },
              { key: 'navigation.services', fallback: 'Services' },
              { key: 'navigation.contact', fallback: 'Contact' },
              { key: 'navigation.login', fallback: 'Login' },
              { key: 'navigation.dashboard', fallback: 'Dashboard' },
            ].map(({ key, fallback }) => (
              <div key={key} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="text-sm text-gray-600">{key}</div>
                <div className="font-medium" dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>
                  {t(key, fallback)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results Summary */}
        {report && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Test Results Summary</h2>
              <div className="space-x-2">
                <button
                  onClick={exportResults}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                >
                  Export Results
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{report.summary.successRate}%</div>
                <div className="text-sm text-blue-600">Success Rate</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">
                  {report.summary.successfulLanguages}/{report.summary.totalLanguages}
                </div>
                <div className="text-sm text-green-600">Languages Passed</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-900">{report.summary.averageLoadTime}ms</div>
                <div className="text-sm text-yellow-600">Avg Load Time</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{report.rtl.count}</div>
                <div className="text-sm text-purple-600">RTL Languages</div>
              </div>
            </div>

            {/* Issues */}
            {(report.issues.failed.length > 0 || report.issues.slow.length > 0) && (
              <div className="space-y-4">
                {report.issues.failed.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-medium text-red-900 mb-2">Failed Languages ({report.issues.failed.length})</h3>
                    <div className="space-y-2">
                      {report.issues.failed.map(({ language, errors }) => (
                        <div key={language} className="text-sm">
                          <span className="font-medium text-red-800">{language}:</span>
                          <span className="text-red-700 ml-2">{errors.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {report.issues.slow.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium text-yellow-900 mb-2">Slow Loading Languages ({report.issues.slow.length})</h3>
                    <div className="space-y-1">
                      {report.issues.slow.map(({ language, loadTime }) => (
                        <div key={language} className="text-sm">
                          <span className="font-medium text-yellow-800">{language}:</span>
                          <span className="text-yellow-700 ml-2">{loadTime}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Language Switching Test Component */}
        <LanguageSwitchingTest
          onTestComplete={handleTestComplete}
          testDelay={1500}
          className="mb-8"
        />

        {/* Monitoring Dashboard */}
        {showMonitoring && (
          <TranslationMonitoringDashboard className="mb-8" />
        )}

        {/* Translation Feedback Widget */}
        <TranslationFeedbackWidget
          namespace="test"
          translationKey="language_testing"
          position="bottom-right"
        />
      </div>
    </div>
  );
};

export default LanguageTestPage;