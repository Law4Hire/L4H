import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, CULTURE_NAMES, isRTL, getTextDirection } from '../i18n-config';
import { getMonitoringService } from '../services/TranslationMonitoringService';
export const LanguageSwitchingTest = ({ onTestComplete, autoTest = false, testDelay = 2000, className = '', }) => {
    const { t, i18n } = useTranslation();
    const [isRunning, setIsRunning] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [testResults, setTestResults] = useState([]);
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
    const testLanguage = useCallback(async (language) => {
        const startTime = Date.now();
        const errors = [];
        const translationSamples = {};
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
                    }
                    else {
                        translationSamples[key] = translation;
                    }
                }
                catch (error) {
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
                    }
                    else {
                        translationSamples[`${ns}:${key}`] = translation;
                    }
                }
                catch (error) {
                    errors.push(`Error with namespace translation ${ns}:${key}: ${error}`);
                }
            }
            const loadTime = Date.now() - startTime;
            // Track performance if monitoring is available
            if (monitoringService) {
                monitoringService.trackLanguageSwitch(currentLanguage, language, loadTime, errors.length === 0);
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
        }
        catch (error) {
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
        const results = [];
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
    const testSingleLanguage = useCallback(async (language) => {
        setIsRunning(true);
        const result = await testLanguage(language);
        setTestResults(prev => {
            const newResults = [...prev];
            const existingIndex = newResults.findIndex(r => r.language === language);
            if (existingIndex >= 0) {
                newResults[existingIndex] = result;
            }
            else {
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
    const getStatusColor = (success) => {
        return success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
    };
    const getLanguageFlag = (language) => {
        const flags = {
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
    return (_jsxs("div", { className: `p-6 bg-white rounded-lg shadow-lg ${className}`, children: [_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Language Switching Test Suite" }), _jsxs("p", { className: "text-gray-600", children: ["Test language switching functionality across all ", SUPPORTED_LANGUAGES.length, " supported languages"] })] }), _jsxs("div", { className: "flex flex-wrap gap-4 mb-6", children: [_jsx("button", { onClick: runFullTest, disabled: isRunning, className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: isRunning ? 'Running Test...' : 'Run Full Test' }), _jsx("button", { onClick: () => setShowDetails(!showDetails), className: "bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700", children: showDetails ? 'Hide Details' : 'Show Details' }), _jsx("button", { onClick: () => setTestResults([]), disabled: isRunning, className: "bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50", children: "Clear Results" })] }), isRunning && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-gray-700", children: ["Testing: ", currentTestIndex >= 0 ? SUPPORTED_LANGUAGES[currentTestIndex] : 'Initializing...'] }), _jsxs("span", { className: "text-sm text-gray-500", children: [Math.round(progress), "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: `${progress}%` } }) })] })), testResults.length > 0 && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [successCount, "/", totalCount] }), _jsx("div", { className: "text-sm text-gray-600", children: "Languages Passed" })] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [Math.round(averageLoadTime), "ms"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Avg Load Time" })] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [Math.round((successCount / totalCount) * 100), "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Success Rate" })] })] })), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6", children: SUPPORTED_LANGUAGES.map((language) => {
                    const result = testResults.find(r => r.language === language);
                    const isCurrent = currentLanguage === language;
                    const isTesting = isRunning && currentTestIndex >= 0 && SUPPORTED_LANGUAGES[currentTestIndex] === language;
                    return (_jsxs("div", { className: `
                p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                ${isTesting ? 'animate-pulse bg-yellow-50' : ''}
                ${result ? (result.success ? 'bg-green-50' : 'bg-red-50') : ''}
              `, onClick: () => !isRunning && testSingleLanguage(language), children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-lg", children: getLanguageFlag(language) }), result && (_jsx("span", { className: `text-xs px-2 py-1 rounded-full ${getStatusColor(result.success)}`, children: result.success ? '✓' : '✗' })), isRTL(language) && (_jsx("span", { className: "text-xs bg-purple-100 text-purple-600 px-1 rounded", children: "RTL" }))] }), _jsx("div", { className: "text-sm font-medium text-gray-900 truncate", children: language }), _jsx("div", { className: "text-xs text-gray-600 truncate", children: CULTURE_NAMES[language] || language }), result && (_jsxs("div", { className: "text-xs text-gray-500 mt-1", children: [result.loadTime, "ms"] }))] }, language));
                }) }), showDetails && testResults.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Detailed Results" }), testResults.map((result) => (_jsxs("div", { className: `p-4 rounded-lg border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-lg", children: getLanguageFlag(result.language) }), _jsx("span", { className: "font-medium", children: result.language }), _jsxs("span", { className: "text-sm text-gray-600", children: ["(", CULTURE_NAMES[result.language] || result.language, ")"] }), result.rtlDetected && (_jsx("span", { className: "text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded", children: "RTL" }))] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "text-sm text-gray-600", children: [result.loadTime, "ms"] }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.success)}`, children: result.success ? 'PASS' : 'FAIL' })] })] }), result.errors.length > 0 && (_jsxs("div", { className: "mb-3", children: [_jsx("h4", { className: "text-sm font-medium text-red-700 mb-1", children: "Errors:" }), _jsx("ul", { className: "text-sm text-red-600 space-y-1", children: result.errors.map((error, index) => (_jsxs("li", { className: "flex items-start", children: [_jsx("span", { className: "text-red-500 mr-1", children: "\u2022" }), error] }, index))) })] })), Object.keys(result.translationSamples).length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: ["Translation Samples (", Object.keys(result.translationSamples).length, "):"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-xs", children: Object.entries(result.translationSamples).slice(0, 6).map(([key, value]) => (_jsxs("div", { className: "bg-white p-2 rounded border", children: [_jsx("div", { className: "font-mono text-gray-500 truncate", children: key }), _jsx("div", { className: "text-gray-900 truncate", dir: result.rtlDetected ? 'rtl' : 'ltr', children: value })] }, key))) })] }))] }, result.language)))] })), _jsxs("div", { className: "mt-6 p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 mb-2", children: "Current Language Test" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Language:" }), " ", i18n.language] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Direction:" }), " ", document.documentElement.dir || 'ltr'] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "RTL:" }), " ", isRTL(i18n.language) ? 'Yes' : 'No'] })] }), _jsxs("div", { className: "mt-3", children: [_jsx("span", { className: "font-medium", children: "Sample Translations:" }), _jsxs("div", { className: "mt-1 space-y-1", children: [_jsxs("div", { dir: isRTL(i18n.language) ? 'rtl' : 'ltr', children: [_jsx("span", { className: "text-gray-600", children: "Welcome:" }), " ", t('common.welcome', 'Welcome')] }), _jsxs("div", { dir: isRTL(i18n.language) ? 'rtl' : 'ltr', children: [_jsx("span", { className: "text-gray-600", children: "Loading:" }), " ", t('common.loading', 'Loading...')] }), _jsxs("div", { dir: isRTL(i18n.language) ? 'rtl' : 'ltr', children: [_jsx("span", { className: "text-gray-600", children: "Error:" }), " ", t('common.error', 'Error')] })] })] })] })] }));
};
export default LanguageSwitchingTest;
