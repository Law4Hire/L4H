import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, CULTURE_NAMES, isRTL, getTextDirection } from '../i18n-config';
import { getMonitoringService } from '../services/TranslationMonitoringService';

interface TestResult {
  language: string;
  success: boolean;
  loadTime: number;
  errors: string[];
  translationSamples: Record<string, string>;
  rtlDetected: boolean;
  directionApplied: boolean;
}

interface LanguageSwitchingTestProps {
  onTestComplete?: (results: TestResult[]) => void;
  autoTest?: boolean;
  testDelay?: number;
  className?: string;
}

export const LanguageSwitchingTest: React.FC<LanguageSwitchingTestProps> = ({
  onTestComplete,
  autoTest = false,
  testDelay = 2000,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const monitoringService = getMonitoringService();

  // Sample translation keys to test
  const testKeys = [
    'common.welcome',
    'common.loading',
    'common.error',
    'common.save',
    'common.cancel',
    'errors.network_error',
    'forms.required_field',
    'auth.login',
    'auth.logout',
    'navigation.home'
  ];

  const testLanguage = useCallback(async (language: string): Promise<TestResult> => {
    const startTime = Date.now();
    const errors: string[] = [];
    const translationSamples: Record<string, string> = {};

    try {
      // Change language and wait for it to load
      await i18n.changeLanguage(language);
      
      // Wait a bit for DOM updates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test RTL detection
      const rtlDetected = isRTL(language);
      const expectedDirection = getTextDirection(language);
      const actualDirection = document.documentElement.dir;
      const directionApplied = actualDirection === expectedDirection;

      if (!directionApplied) {
        errors.push(`Direction not applied correctly. Expected: ${expectedDirection}, Actual: ${actualDirection}`);
      }

      // Test translation loading for sample keys
      for (const key of testKeys) {
        try {
          const translation = t(key);
          if (translation === key) {
            errors.push(`Missing translation for key: ${key}`);
          } else {
            translationSamples[key] = translation;
          }
        } catch (error) {
          errors.push(`Error translating key ${key}: ${error}`);
        }
      }

      // Test namespace-specific translations
      const namespaceTests = [
        { ns: 'common', key: 'welcome' },
        { ns: 'errors', key: 'network_error' },
        { ns: 'forms', key: 'required_field' },
      ];

      for (const { ns, key } of namespaceTests) {
        try {
          const translation = t(`${ns}:${key}`);
          if (translation === `${ns}:${key}`) {
            errors.push(`Missing namespace translation: ${ns}:${key}`);
          } else {
            translationSamples[`${ns}:${key}`] = translation;
          }
        } catch (error) {
          errors.push(`Error with namespace translation ${ns}:${key}: ${error}`);
        }
      }

      const loadTime = Date.now() - startTime;

      // Track performance if monitoring is available
      if (monitoringService) {
        monitoringService.trackLanguageSwitch(
          currentLanguage,
          language,
          loadTime,
          errors.length === 0
        );
      }

      return {
        language,
        success: errors.length === 0,
        loadTime,
        errors,
        translationSamples,
        rtlDetected,
        directionApplied,
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        language,
        success: false,
        loadTime,
        errors: [errorMessage],
        translationSamples: {},
        rtlDetected: isRTL(language),
        directionApplied: false,
      };
    }
  }, [t, i18n, currentLanguage, monitoringService]);

  const runFullTest = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTestIndex(0);
    setProgress(0);

    const results: TestResult[] = [];

    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const language = SUPPORTED_LANGUAGES[i];
      setCurrentTestIndex(i);
      setCurrentLanguage(language);
      setProgress((i / SUPPORTED_LANGUAGES.length) * 100);

      const result = await testLanguage(language);
      results.push(result);
      setTestResults([...results]);

      // Wait between tests to allow for proper loading
      if (i < SUPPORTED_LANGUAGES.length - 1) {
        await new Promise(resolve => setTimeout(resolve, testDelay));
      }
    }

    setCurrentTestIndex(-1);
    setProgress(100);
    setIsRunning(false);

    if (onTestComplete) {
      onTestComplete(results);
    }
  }, [testLanguage, testDelay, onTestComplete]);

  const testSingleLanguage = useCallback(async (language: string) => {
    setIsRunning(true);
    const result = await testLanguage(language);
    setTestResults(prev => {
      const newResults = [...prev];
      const existingIndex = newResults.findIndex(r => r.language === language);
      if (existingIndex >= 0) {
        newResults[existingIndex] = result;
      } else {
        newResults.push(result);
      }
      return newResults;
    });
    setIsRunning(false);
  }, [testLanguage]);

  useEffect(() => {
    if (autoTest) {
      runFullTest();
    }
  }, [autoTest, runFullTest]);

  const successCount = testResults.filter(r => r.success).length;
  const totalCount = testResults.length;
  const averageLoadTime = testResults.length > 0 
    ? testResults.reduce((sum, r) => sum + r.loadTime, 0) / testResults.length 
    : 0;

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      'en-US': '🇺🇸',
      'ar-SA': '🇸🇦',
      'bn-BD': '🇧🇩',
      'de-DE': '🇩🇪',
      'es-ES': '🇪🇸',
      'fr-FR': '🇫🇷',
      'hi-IN': '🇮🇳',
      'id-ID': '🇮🇩',
      'it-IT': '🇮🇹',
      'ja-JP': '🇯🇵',
      'ko-KR': '🇰🇷',
      'mr-IN': '🇮🇳',
      'pl-PL': '🇵🇱',
      'pt-BR': '🇧🇷',
      'ru-RU': '🇷🇺',
      'ta-IN': '🇮🇳',
      'te-IN': '🇮🇳',
      'tr-TR': '🇹🇷',
      'ur-PK': '🇵🇰',
      'vi-VN': '🇻🇳',
      'zh-CN': '🇨🇳',
    };
    return flags[language] || '🌐';
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Language Switching Test Suite
        </h2>
        <p className="text-gray-600">
          Test language switching functionality across all {SUPPORTED_LANGUAGES.length} supported languages
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={runFullTest}
          disabled={isRunning}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Test...' : 'Run Full Test'}
        </button>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        <button
          onClick={() => setTestResults([])}
          disabled={isRunning}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          Clear Results
        </button>
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Testing: {currentTestIndex >= 0 ? SUPPORTED_LANGUAGES[currentTestIndex] : 'Initializing...'}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {successCount}/{totalCount}
            </div>
            <div className="text-sm text-gray-600">Languages Passed</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(averageLoadTime)}ms
            </div>
            <div className="text-sm text-gray-600">Avg Load Time</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((successCount / totalCount) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      )}

      {/* Language Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {SUPPORTED_LANGUAGES.map((language) => {
          const result = testResults.find(r => r.language === language);
          const isCurrent = currentLanguage === language;
          const isTesting = isRunning && currentTestIndex >= 0 && SUPPORTED_LANGUAGES[currentTestIndex] === language;
          
          return (
            <div
              key={language}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                ${isTesting ? 'animate-pulse bg-yellow-50' : ''}
                ${result ? (result.success ? 'bg-green-50' : 'bg-red-50') : ''}
              `}
              onClick={() => !isRunning && testSingleLanguage(language)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{getLanguageFlag(language)}</span>
                {result && (
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(result.success)}`}>
                    {result.success ? '✓' : '✗'}
                  </span>
                )}
                {isRTL(language) && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">RTL</span>
                )}
              </div>
              
              <div className="text-sm font-medium text-gray-900 truncate">
                {language}
              </div>
              
              <div className="text-xs text-gray-600 truncate">
                {CULTURE_NAMES[language] || language}
              </div>
              
              {result && (
                <div className="text-xs text-gray-500 mt-1">
                  {result.loadTime}ms
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Results */}
      {showDetails && testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
          
          {testResults.map((result) => (
            <div
              key={result.language}
              className={`p-4 rounded-lg border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getLanguageFlag(result.language)}</span>
                  <span className="font-medium">{result.language}</span>
                  <span className="text-sm text-gray-600">
                    ({CULTURE_NAMES[result.language] || result.language})
                  </span>
                  {result.rtlDetected && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                      RTL
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {result.loadTime}ms
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.success)}`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-1">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Translation Samples */}
              {Object.keys(result.translationSamples).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Translation Samples ({Object.keys(result.translationSamples).length}):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {Object.entries(result.translationSamples).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="bg-white p-2 rounded border">
                        <div className="font-mono text-gray-500 truncate">{key}</div>
                        <div className="text-gray-900 truncate" dir={result.rtlDetected ? 'rtl' : 'ltr'}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Current Language Display */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Language Test</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Language:</span> {i18n.language}
          </div>
          <div>
            <span className="font-medium">Direction:</span> {document.documentElement.dir || 'ltr'}
          </div>
          <div>
            <span className="font-medium">RTL:</span> {isRTL(i18n.language) ? 'Yes' : 'No'}
          </div>
        </div>
        
        <div className="mt-3">
          <span className="font-medium">Sample Translations:</span>
          <div className="mt-1 space-y-1">
            <div dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>
              <span className="text-gray-600">Welcome:</span> {t('common.welcome', 'Welcome')}
            </div>
            <div dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>
              <span className="text-gray-600">Loading:</span> {t('common.loading', 'Loading...')}
            </div>
            <div dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>
              <span className="text-gray-600">Error:</span> {t('common.error', 'Error')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitchingTest;