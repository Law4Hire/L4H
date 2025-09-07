import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthClient } from './AuthClient'

// Mock fetch
global.fetch = vi.fn()

describe('AuthClient', () => {
  let authClient: AuthClient

  beforeEach(() => {
    vi.clearAllMocks()
    authClient = new AuthClient('/api')
  })

  describe('token management', () => {
    it('should set and get token', () => {
      const token = 'test-jwt-token'
      authClient.setToken(token)
      expect(authClient.getToken()).toBe(token)
      expect(authClient.isAuthenticated()).toBe(true)
    })

    it('should clear token', () => {
      authClient.setToken('test-token')
      authClient.clearToken()
      expect(authClient.getToken()).toBe(null)
      expect(authClient.isAuthenticated()).toBe(false)
    })
  })

  describe('remember', () => {
    it('should exchange cookie for JWT successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ token: 'remembered-jwt' })
      }

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

      const result = await authClient.remember()

      expect(fetch).toHaveBeenCalledWith('/api/v1/auth/remember', {
        method: 'POST',
        credentials: 'include'
      })
      expect(result).toBe(true)
      expect(authClient.getToken()).toBe('remembered-jwt')
    })

    it('should return false when remember fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response)

      const result = await authClient.remember()

      expect(result).toBe(false)
      expect(authClient.getToken()).toBe(null)
    })

    it('should return false on network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await authClient.remember()

      expect(result).toBe(false)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ token: 'login-jwt' })
      }

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

      const result = await authClient.login('test@example.com', 'password', true)

      expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
          rememberMe: true
        })
      })
      expect(result).toEqual({ success: true, token: 'login-jwt' })
      expect(authClient.getToken()).toBe('login-jwt')
    })

    it('should handle login failure', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ title: 'Invalid credentials' })
      }

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

      const result = await authClient.login('test@example.com', 'wrong-password')

      expect(result).toEqual({ 
        success: false, 
        error: 'Invalid credentials' 
      })
      expect(authClient.getToken()).toBe(null)
    })
  })

  describe('authenticated fetch', () => {
    it('should add Authorization header when token is present', async () => {
      authClient.setToken('test-token')
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)

      await authClient.get('/v1/cases')

      expect(fetch).toHaveBeenCalledWith('/api/v1/cases', {
        method: 'GET',
        headers: new Headers({
          'Authorization': 'Bearer test-token'
        }),
        credentials: 'include'
      })
    })

    it('should not add Authorization header when no token', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)

      await authClient.get('/v1/cases')

      expect(fetch).toHaveBeenCalledWith('/api/v1/cases', {
        method: 'GET',
        headers: new Headers(),
        credentials: 'include'
      })
    })
  })
})
