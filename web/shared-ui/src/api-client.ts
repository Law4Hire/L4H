// API client with CSRF support and JWT handling
interface ProblemDetails {
  title: string
  detail?: string
  status?: number
  type?: string
  instance?: string
}

interface ApiResponse<T = any> {
  data?: T
  error?: ProblemDetails
}

class ApiError extends Error {
  constructor(
    public title: string,
    public detail?: string,
    public status?: number
  ) {
    super(detail || title)
    this.name = 'ApiError'
  }
}

// JWT token stored in memory
let jwtToken: string | null = null

// Initialize JWT token from localStorage on module load
if (typeof window !== 'undefined') {
  jwtToken = localStorage.getItem('jwt_token')
}

// CSRF token cache
let csrfToken: string | null = null
let csrfTokenExpiry: number = 0

// Cookie endpoints that require CSRF token
const COOKIE_ENDPOINTS = [
  '/v1/auth/login',
  '/v1/auth/remember'
]

// Get CSRF token
async function getCsrfToken(): Promise<string> {
  const now = Date.now()
  
  // Return cached token if still valid (5 minutes)
  if (csrfToken && now < csrfTokenExpiry) {
    return csrfToken
  }
  
  try {
    const response = await fetch('/api/v1/auth/csrf', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to get CSRF token')
    }
    
    const data = await response.json()
    csrfToken = data.token
    csrfTokenExpiry = now + (5 * 60 * 1000) // 5 minutes
    return csrfToken || ''
  } catch (error) {
    console.warn('Failed to get CSRF token:', error)
    return ''
  }
}

// Check if endpoint requires CSRF token
function requiresCsrfToken(path: string): boolean {
  return COOKIE_ENDPOINTS.some(endpoint => path.includes(endpoint))
}

// Main fetch wrapper
async function fetchJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `/api${path}`

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>)
  }

  // Add JWT token if available - ensure we load from localStorage if needed
  const token = getJwtToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Add CSRF token for cookie endpoints
  if (requiresCsrfToken(path)) {
    const csrf = await getCsrfToken()
    if (csrf) {
      headers['X-CSRF-TOKEN'] = csrf
    }
  }
  
  // Include credentials for cookie endpoints
  const credentials = requiresCsrfToken(path) ? 'include' : 'same-origin'
  
  try {
    const response = await fetch(url, {
      ...init,
      headers,
      credentials
    })
    
    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}`,
          response.statusText,
          response.status
        )
      }
      return response as unknown as T
    }
    
    // Check if body is empty before parsing
    const text = await response.text()
    const data: ApiResponse<T> = text ? JSON.parse(text) : {}
    
    if (!response.ok) {
      // Try to refresh token on 401 Unauthorized
      if (response.status === 401 && path !== '/v1/auth/remember' && path !== '/v1/auth/login') {
        // Check if logout is in progress - if so, don't try to refresh
        const logoutInProgress = typeof sessionStorage !== 'undefined' &&
                                 sessionStorage.getItem('logout_in_progress') === 'true'

        if (logoutInProgress) {
          console.log('[AUTH] Logout in progress - skipping auto-refresh')
          jwtToken = null
          localStorage.removeItem('jwt_token')
          throw new Error('User logged out')
        }

        try {
          const refreshResponse = await fetch('/api/v1/auth/remember', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          })

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            if (refreshData.token) {
              // Update the token and retry the original request
              jwtToken = refreshData.token
              localStorage.setItem('jwt_token', refreshData.token)

              // Retry the original request with new token
              const retryHeaders = {
                ...headers,
                'Authorization': `Bearer ${jwtToken}`
              }

              const retryResponse = await fetch(url, {
                ...init,
                headers: retryHeaders,
                credentials
              })

              if (retryResponse.ok) {
                const retryContentType = retryResponse.headers.get('content-type')
                if (!retryContentType?.includes('application/json')) {
                  return retryResponse as unknown as T
                }
                const retryData = await retryResponse.json()
                return retryData.data || retryData as T
              }
            }
          }
        } catch (refreshError) {
          // If refresh fails, clear auth state and redirect to home
          console.warn('Token refresh failed:', refreshError)

          // Clear all auth state
          jwtToken = null
          localStorage.removeItem('jwt_token')

          // If we're in a browser context, trigger logout
          if (typeof window !== 'undefined' && response.status === 401) {
            // Dispatch event to notify auth state change
            window.dispatchEvent(new Event('jwt-token-changed'))

            // Only redirect if not already on public pages
            if (!window.location.pathname.match(/^\/(login|verify|interview|results|$)/)) {
              window.location.href = '/'
            }
          }
        }
      }

      // Check if the response body itself is a ProblemDetails object
      // or if it follows the { error: ... } envelope pattern
      const errorData = data.error || (data.title ? data : undefined) || {
        title: `HTTP ${response.status}`,
        detail: response.statusText,
        status: response.status
      }
      throw new ApiError(errorData.title, errorData.detail, errorData.status)
    }
    
    return data.data || data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network or other errors
    throw new ApiError(
      'Network Error',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

// Set JWT token
export function setJwtToken(token: string | null): void {
  jwtToken = token
  if (token) {
    localStorage.setItem('jwt_token', token)
  } else {
    localStorage.removeItem('jwt_token')
  }
}

// Get current JWT token
export function getJwtToken(): string | null {
  if (!jwtToken) {
    jwtToken = localStorage.getItem('jwt_token')
  }
  return jwtToken
}

// Clear tokens
export function clearTokens(): void {
  jwtToken = null
  csrfToken = null
  csrfTokenExpiry = 0
}

// Auth API methods
export const auth = {
  async login(credentials: { email: string; password: string; rememberMe?: boolean }) {
    return fetchJson('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  },
  
  async signup(userData: { email: string; password: string; firstName: string; lastName: string }) {
    return fetchJson('/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },
  
  async remember() {
    return fetchJson('/v1/auth/remember', {
      method: 'POST'
    })
  },
  
  async verify(token: string) {
    return fetchJson(`/v1/auth/verify?token=${encodeURIComponent(token)}`)
  },
  
  async forgot(email: string) {
    return fetchJson('/v1/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  },
  
  async reset(data: { token: string; newPassword: string }) {
    return fetchJson('/v1/auth/reset', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async logoutAll() {
    return fetchJson('/v1/auth/logout-all', {
      method: 'POST'
    })
  },

  async logout() {
    return fetchJson('/v1/auth/logout', {
      method: 'POST'
    })
  },

  async updateProfile(profileData: {
    phoneNumber?: string
    streetAddress?: string
    city?: string
    stateProvince?: string
    postalCode?: string
    country?: string
    nationality?: string
    dateOfBirth?: string
    maritalStatus?: string
  }) {
    return fetchJson('/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }
}

// Cases API methods
export const cases = {
  async mine() {
    return fetchJson('/v1/cases/mine')
  },

  async get(caseId: string) {
    return fetchJson(`/v1/cases/${caseId}`)
  },

  async setPackage(caseId: string, packageId: string) {
    return fetchJson(`/v1/cases/${caseId}/package`, {
      method: 'POST',
      body: JSON.stringify({ packageId })
    })
  },

  async resetVisaType(caseId: string) {
    return fetchJson(`/v1/cases/${caseId}/reset-visa-type`, {
      method: 'POST'
    })
  }
}

// Pricing API methods
export const pricing = {
  async get(visaType?: string | string[], country?: string) {
    const params = new URLSearchParams()
    if (visaType) {
      if (Array.isArray(visaType)) {
        visaType.forEach(v => params.append('visaType', v))
      } else {
        params.append('visaType', visaType)
      }
    }
    if (country) params.append('country', country)
    
    const query = params.toString()
    return fetchJson(`/v1/pricing${query ? `?${query}` : ''}`)
  }
}

// Appointments API methods
export const appointments = {
  async list() {
    return fetchJson('/v1/appointments')
  },

  async create(data: {
    caseId: string
    scheduledAt: string
    duration: number
    notes?: string
  }) {
    // Use the /create endpoint which auto-assigns staff and handles time calculations
    const requestData = {
      caseId: data.caseId,
      preferredStartTime: data.scheduledAt,
      durationMinutes: data.duration,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: data.notes
    }

    return fetchJson('/v1/appointments/create', {
      method: 'POST',
      body: JSON.stringify(requestData)
    })
  },
  
  async reschedule(appointmentId: string, data: {
    scheduledAt: string
    reason?: string
  }) {
    return fetchJson(`/v1/appointments/${appointmentId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async cancel(appointmentId: string, reason?: string) {
    return fetchJson(`/v1/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }
}

// Messages API methods
export const messages = {
  async threads() {
    return fetchJson('/v1/messaging/threads')
  },
  
  async thread(threadId: string) {
    return fetchJson(`/v1/messaging/threads/${threadId}`)
  },
  
  async post(data: {
    threadId?: string
    recipientId?: string
    subject: string
    content: string
    priority?: 'low' | 'medium' | 'high'
  }) {
    // If we have a threadId, use the thread-specific endpoint
    if (data.threadId) {
      return fetchJson(`/v1/messaging/threads/${data.threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: data.content })
      })
    }
    // Otherwise use the general messaging endpoint (if it exists, or create a thread first)
    return fetchJson('/v1/messaging/threads', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async markRead(messageId: string) {
    return fetchJson(`/v1/messaging/messages/${messageId}/read`, {
      method: 'POST'
    })
  }
}

// Uploads API methods
export const uploads = {
  async presign(data: {
    caseId: string
    fileName: string
    contentType: string
    sizeBytes: number
  }) {
    return fetchJson('/v1/uploads/presign', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async confirm(data: {
    caseId: string
    fileName: string
    uploadToken: string
  }) {
    return fetchJson('/v1/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async list(caseId: string) {
    return fetchJson(`/v1/uploads/list?caseId=${encodeURIComponent(caseId)}`)
  }
}

// Invoices API methods
export const invoices = {
  async list(caseId?: string) {
    const params = caseId ? `?caseId=${encodeURIComponent(caseId)}` : ''
    return fetchJson(`/v1/invoices${params}`)
  },
  
  async download(invoiceId: string) {
    return fetchJson(`/v1/invoices/${invoiceId}/download`)
  }
}

// Interview API methods
// New unified interview API
export const interview = {
  // Start authenticated interview
  async start(caseId: string) {
    return fetchJson<{
      sessionId: string
      sessionToken: string
      firstQuestion: any
    }>('/v1/interview/start', {
      method: 'POST',
      body: JSON.stringify({ caseId })
    })
  },

  // Start a new anonymous interview
  async startAnonymous(languageCode?: string) {
    return fetchJson<{
      sessionToken: string
      sessionId: string
      firstQuestion: {
        key: string
        text: string
        category: string
        inputType: string
        options: Array<{ value: string; label: string }>
        isRequired: boolean
        order: number
      }
    }>('/v1/interview/anonymous/start', {
      method: 'POST',
      body: JSON.stringify({ languageCode })
    })
  },

  // Resume an existing anonymous interview
  async resumeAnonymous(sessionToken: string) {
    return fetchJson<{
      sessionId: string
      previousAnswers: Array<{
        question: string
        answer: string
        answeredAt: string
      }>
      nextQuestion: any | null
      isComplete: boolean
      evaluations: any[] | null
    }>('/v1/interview/anonymous/resume', {
      method: 'POST',
      body: JSON.stringify({ sessionToken })
    })
  },

  // Submit an answer and get next question
  async submitAnswer(sessionToken: string, questionKey: string, answer: string) {
    return fetchJson<{
      isComplete: boolean
      nextQuestion: any | null
      totalAnswers: number
      remainingVisasCount: number
    }>('/v1/interview/anonymous/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, questionKey, answer })
    })
  },

  // Complete the interview and get evaluations
  async complete(sessionToken: string) {
    return fetchJson<{
      sessionId: string
      evaluations: Array<{
        visaTypeId: number
        visaCode: string
        visaName: string
        status: string
        matchScore: number
        rank: number
        explanation: string
        missingInformation: string[]
        requiredDocuments: string[]
        keyBenefits: string[]
        isUserSelected: boolean
        isAttorneyLocked: boolean
        lockReason?: string
      }>
      totalQuestionsAnswered: number
    }>('/v1/interview/anonymous/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionToken })
    })
  },

  // Get visa evaluations for a session
  async getEvaluations(sessionToken: string) {
    return fetchJson(`/v1/interview/anonymous/evaluations/${sessionToken}`)
  },

  // User selects their preferred visa
  async selectVisa(sessionToken: string, visaTypeId: number) {
    return fetchJson('/v1/interview/anonymous/select-visa', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, visaTypeId })
    })
  },

  // Create account with interview data
  async registerWithInterview(data: {
    anonymousToken: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) {
    return fetchJson<{
      sessionId: string
      userId: string
      email: string
      success: boolean
      errorMessage?: string
    }>('/v1/interview/anonymous/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

// Professional Interview API methods
export const professional = {
  async lockVisa(data: {
    sessionId: string
    visaTypeId: number
    reason?: string
  }) {
    return fetchJson('/v1/interview/professional/lock-visa', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async unlockVisa(data: {
    sessionId: string
    visaTypeId: number
    reason?: string
  }) {
    return fetchJson('/v1/interview/professional/unlock-visa', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async getSessionEvaluations(sessionId: string) {
    return fetchJson<Array<{
      visaTypeId: number
      visaCode: string
      visaName: string
      status: string
      matchScore: number
      rank: number
      explanation: string
      missingInformation: string[]
      requiredDocuments: string[]
      keyBenefits: string[]
      isUserSelected: boolean
      isAttorneyLocked: boolean
      lockReason?: string
    }>>(`/v1/interview/professional/session/${sessionId}/evaluations`)
  },

  async getSessionLockStatus(sessionId: string) {
    return fetchJson<{
      isLocked: boolean
      lockedVisaTypeId?: number
      lockedVisaName?: string
      lockedReason?: string
      lockedBy?: string
      lockedAt?: string
    }>(`/v1/interview/professional/session/${sessionId}/lock-status`)
  }
}

// Admin API methods
export const admin = {
  async pricing() {
    return fetchJson('/v1/admin/pricing')
  },
  
  async updatePricing(data: any) {
    return fetchJson('/v1/admin/pricing', {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },
  
  async workflows() {
    return fetchJson('/v1/admin/workflows')
  },
  
  async approveWorkflow(workflowId: string) {
    return fetchJson(`/v1/admin/workflows/${workflowId}/approve`, {
      method: 'POST'
    })
  },
  
  async rejectWorkflow(workflowId: string, reason: string) {
    return fetchJson(`/v1/admin/workflows/${workflowId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  },
  
  async timeEntries() {
    return fetchJson('/v1/admin/time-entries')
  },
  
  async approveTimeEntry(entryId: string) {
    return fetchJson(`/v1/admin/time-entries/${entryId}/approve`, {
      method: 'POST'
    })
  },
  
  async rejectTimeEntry(entryId: string, reason: string) {
    return fetchJson(`/v1/admin/time-entries/${entryId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  },
  
  async reports(type: string, dateRange: { from: string; to: string }) {
    return fetchJson(`/v1/admin/reports/${type}`, {
      method: 'POST',
      body: JSON.stringify(dateRange)
    })
  },

  async users() {
    return fetchJson('/v1/admin/users')
  },

  async createUser(userData: any) {
    return fetchJson('/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  async updateUserRoles(userId: string, roles: { isAdmin: boolean; isStaff: boolean }) {
    return fetchJson(`/v1/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify(roles)
    })
  },

  async deleteUser(userId: string) {
    return fetchJson(`/v1/admin/users/${userId}`, {
      method: 'DELETE'
    })
  },

  async changeUserPassword(userId: string, newPassword: string) {
    return fetchJson(`/v1/admin/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword })
    })
  },

  async changeUserStatus(userId: string, isActive: boolean) {
    return fetchJson(`/v1/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    })
  }
}

// Export the main fetchJson function and error class
export { fetchJson, ApiError }
export default fetchJson
