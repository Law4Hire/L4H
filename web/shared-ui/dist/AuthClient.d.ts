export declare class AuthClient {
    private jwt;
    private baseUrl;
    constructor(baseUrl?: string);
    setToken(token: string | null): void;
    getToken(): string | null;
    isAuthenticated(): boolean;
    clearToken(): void;
    remember(): Promise<boolean>;
    login(email: string, password: string, rememberMe?: boolean): Promise<{
        success: boolean;
        token?: string;
        error?: string;
    }>;
    logout(): void;
    fetch(url: string, options?: RequestInit): Promise<Response>;
    get(url: string): Promise<Response>;
    post(url: string, body?: any): Promise<Response>;
    put(url: string, body?: any): Promise<Response>;
    delete(url: string): Promise<Response>;
}
export declare const authClient: AuthClient;
