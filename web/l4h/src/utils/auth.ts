/**
 * Delete a cookie by name
 * Sets expiration to past date to force deletion
 */
export function deleteCookie(name: string) {
  // Delete with various domain/path combinations to ensure it's removed
  const domains = [
    '', // Current domain
    'localhost',
    window.location.hostname,
    `.${window.location.hostname}`,
  ]

  const paths = ['/', '/api']

  domains.forEach(domain => {
    paths.forEach(path => {
      let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`
      if (domain) {
        cookieString += ` domain=${domain};`
      }
      document.cookie = cookieString
    })
  })
}

/**
 * Clear all authentication state from the browser
 */
export function clearAllAuthState() {
  // Clear localStorage items
  localStorage.removeItem('jwt_token')

  // Clear sessionStorage items
  sessionStorage.clear()

  // Delete auth-related cookies
  deleteCookie('l4h_remember')
  deleteCookie('jwt_token')
  deleteCookie('auth_token')
  deleteCookie('.AspNetCore.Cookies')
  deleteCookie('.AspNetCore.Session')
}

/**
 * Perform complete logout - clear all auth state and redirect
 */
export async function performLogout() {
  console.log('[LOGOUT] Starting logout process...')

  // Import shared-ui functions
  const { setJwtToken, auth, clearTokens } = await import('@l4h/shared-ui')

  // Clear all browser auth state FIRST (before any API calls)
  clearAllAuthState()

  // Clear tokens in shared-ui module
  setJwtToken(null)
  clearTokens()

  console.log('[LOGOUT] Local state cleared')

  // Try to call backend logoutAll (best effort - requires valid token)
  try {
    await Promise.race([
      auth.logoutAll(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ])
    console.log('[LOGOUT] Backend logoutAll succeeded')
  } catch (e) {
    console.warn('[LOGOUT] Backend logoutAll failed or timed out (this is OK):', e)
  }

  // Always call anonymous logout to ensure HttpOnly cookies are cleared
  try {
    await Promise.race([
      auth.logout(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ])
    console.log('[LOGOUT] Backend logout succeeded')
  } catch (e) {
    console.warn('[LOGOUT] Backend logout failed or timed out (this is OK):', e)
  }

  // Dispatch event to notify auth state change
  window.dispatchEvent(new Event('jwt-token-changed'))
  console.log('[LOGOUT] Dispatched jwt-token-changed event')

  // Small delay to ensure event handlers fire
  await new Promise(resolve => setTimeout(resolve, 100))

  console.log('[LOGOUT] Redirecting to home page...')
  // Force reload to home page with timestamp to prevent caching
  window.location.href = '/?t=' + Date.now()
}
