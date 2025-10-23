import { LoadResult } from '../services/TranslationLoader';
export interface UseTranslationLoaderOptions {
    language: string;
    namespaces: string[];
    loadPath: string;
    preloadCritical?: boolean;
    criticalNamespaces?: string[];
    autoLoad?: boolean;
}
export interface TranslationLoaderState {
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    loadedNamespaces: string[];
    failedNamespaces: string[];
    results: {
        [namespace: string]: LoadResult;
    };
    retryCount: number;
}
export declare function useTranslationLoader(options: UseTranslationLoaderOptions): {
    loadTranslations: (namespacesToLoad?: string[], priority?: boolean) => Promise<{
        [key: string]: LoadResult;
    }>;
    preloadCriticalNamespaces: () => Promise<{
        [namespace: string]: LoadResult;
    } | undefined>;
    retryFailedNamespaces: () => Promise<{
        [key: string]: LoadResult;
    } | undefined>;
    loadNamespace: (namespace: string) => Promise<LoadResult>;
    clearCacheAndReload: () => Promise<{
        [key: string]: LoadResult;
    }>;
    getNamespaceState: (namespace: string) => {
        isLoaded: boolean;
        hasFailed: boolean;
        isLoading: boolean;
        result: LoadResult;
        fromCache: boolean;
    };
    isAllLoaded: boolean;
    hasPartialLoad: boolean;
    loadProgress: number;
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string;
    loadedNamespaces: string[];
    failedNamespaces: string[];
    results: {
        [namespace: string]: LoadResult;
    };
    retryCount: number;
};
