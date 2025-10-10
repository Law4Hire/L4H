// AuthClient - thin fetch wrapper with JWT handling
export class AuthClient {
    constructor(baseUrl = 'http://localhost:8765/api') {
        Object.defineProperty(this, "jwt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baseUrl = baseUrl;
    }
    // Set JWT token in memory
    setToken(token) {
        this.jwt = token;
    }
    // Get current JWT token
    getToken() {
        return this.jwt;
    }
    // Check if user is authenticated
    isAuthenticated() {
        return this.jwt !== null;
    }
    // Clear JWT token (logout)
    clearToken() {
        this.jwt = null;
    }
    // Remember me flow - exchange cookie for JWT
    async remember() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/auth/remember`, {
                method: 'POST',
                credentials: 'include' // Include cookies
            });
            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    this.setToken(data.token);
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Remember me failed:', error);
            return false;
        }
    }
    // Login with email and password
    async login(email, password, rememberMe = false) {
        try {
            const response = await fetch(`${this.baseUrl}/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies for remember me
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe
                })
            });
            const data = await response.json();
            if (response.ok && data.token) {
                this.setToken(data.token);
                return { success: true, token: data.token };
            }
            else {
                return {
                    success: false,
                    error: data.title || data.detail || 'Login failed'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error'
            };
        }
    }
    // Logout - clear JWT only (cookie remains for remember me)
    logout() {
        this.clearToken();
    }
    // Authenticated fetch wrapper
    async fetch(url, options = {}) {
        const headers = new Headers(options.headers);
        if (this.jwt) {
            headers.set('Authorization', `Bearer ${this.jwt}`);
        }
        return fetch(`${this.baseUrl}${url}`, {
            ...options,
            headers,
            credentials: 'include'
        });
    }
    // Helper method for GET requests
    async get(url) {
        return this.fetch(url, { method: 'GET' });
    }
    // Helper method for POST requests
    async post(url, body) {
        return this.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
    }
    // Helper method for PUT requests
    async put(url, body) {
        return this.fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
    }
    // Helper method for DELETE requests
    async delete(url) {
        return this.fetch(url, { method: 'DELETE' });
    }
}
// Global auth client instance
export const authClient = new AuthClient();
