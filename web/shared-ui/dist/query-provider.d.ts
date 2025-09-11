import { QueryClient } from '@tanstack/react-query';
import { ReactNode } from 'react';
declare const queryClient: QueryClient;
interface QueryProviderProps {
    children: ReactNode;
}
export declare function QueryProvider({ children }: QueryProviderProps): import("react/jsx-runtime").JSX.Element;
export { queryClient };
