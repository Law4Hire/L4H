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

  // Set a flag to prevent auto-refresh after logout
  sessionStorage.setItem('logout_in_progress', 'true')

  // Clear other sessionStorage items
  Object.keys(sessionStorage).forEach(key => {
    if (key !== 'logout_in_progress') {
      sessionStorage.removeItem(key)
    }
  })

  // Delete auth-related cookies (these are HttpOnly so JS can't actually delete them,
  // but we try anyway for non-HttpOnly cookies)
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

  // Call backend logout to clear HttpOnly cookies (MUST happen before clearing local state)
  // This is critical - the l4h_remember cookie is HttpOnly and can only be deleted by the server
  try {
    await Promise.race([
      auth.logout(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ])
    console.log('[LOGOUT] Backend logout succeeded - HttpOnly cookies cleared')
  } catch (e) {
    console.warn('[LOGOUT] Backend logout failed or timed out:', e)
    // Continue anyway - clear client state even if server call fails
  }

  // Try to call backend logoutAll to revoke all sessions
  try {
    await Promise.race([
      auth.logoutAll(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ])
    console.log('[LOGOUT] Backend logoutAll succeeded')
  } catch (e) {
    console.warn('[LOGOUT] Backend logoutAll failed or timed out (this is OK):', e)
  }

  // Dispatch event to notify auth state change
  window.dispatchEvent(new Event('jwt-token-changed'))
  console.log('[LOGOUT] Dispatched jwt-token-changed event')

  // Small delay to ensure event handlers fire
  await new Promise(resolve => setTimeout(resolve, 100))

  console.log('[LOGOUT] Redirecting to home page...')

  // Clear the logout flag on the new page after a short delay
  setTimeout(() => {
    if (sessionStorage) {
      sessionStorage.removeItem('logout_in_progress')
    }
  }, 500)

  // Force reload to home page with timestamp to prevent caching
  window.location.href = '/?t=' + Date.now()
}
