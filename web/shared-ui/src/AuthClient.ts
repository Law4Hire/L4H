// AuthClient - thin fetch wrapper with JWT handling
export class AuthClient {
  private jwt: string | null = null
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:8765/api') {
    this.baseUrl = baseUrl
  }

  // Set JWT token in memory
  setToken(token: string | null): void {
    this.jwt = token
  }

  // Get current JWT token
  getToken(): string | null {
    return this.jwt
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.jwt !== null
  }

  // Clear JWT token (logout)
  clearToken(): void {
    this.jwt = null
  }

  // Remember me flow - exchange cookie for JWT
  async remember(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/auth/remember`, {
        method: 'POST',
        credentials: 'include' // Include cookies
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          this.setToken(data.token)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Remember me failed:', error)
      return false
    }
  }

  // Login with email and password
  async login(email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; token?: string; error?: string }> {
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
      })

      const data = await response.json()

      if (response.ok && data.token) {
        this.setToken(data.token)
        return { success: true, token: data.token }
      } else {
        return { 
          success: false, 
          error: data.title || data.detail || 'Login failed' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      }
    }
  }

  // Logout - clear JWT only (cookie remains for remember me)
  logout(): void {
    this.clearToken()
  }

  // Authenticated fetch wrapper
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers)
    
    if (this.jwt) {
      headers.set('Authorization', `Bearer ${this.jwt}`)
    }

    return fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    })
  }

  // Helper method for GET requests
  async get(url: string): Promise<Response> {
    return this.fetch(url, { method: 'GET' })
  }

  // Helper method for POST requests
  async post(url: string, body?: any): Promise<Response> {
    return this.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
  }

  // Helper method for PUT requests
  async put(url: string, body?: any): Promise<Response> {
    return this.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
  }

  // Helper method for DELETE requests
  async delete(url: string): Promise<Response> {
    return this.fetch(url, { method: 'DELETE' })
  }
}

// Global auth client instance
export const authClient = new AuthClient()
