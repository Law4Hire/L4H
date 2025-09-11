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

// CSRF token cache
let csrfToken: string | null = null
let csrfTokenExpiry: number = 0

// Cookie endpoints that require CSRF token
const COOKIE_ENDPOINTS = [
  '/v1/auth/login',
  '/v1/auth/remember',
  '/v1/i18n/culture'
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
  const url = path.startsWith('/api') ? path : `/api${path}`
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>)
  }
  
  // Add JWT token if available
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`
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
    
    const data: ApiResponse<T> = await response.json()
    
    if (!response.ok) {
      const error = data.error || {
        title: `HTTP ${response.status}`,
        detail: response.statusText,
        status: response.status
      }
      throw new ApiError(error.title, error.detail, error.status)
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
}

// Get current JWT token
export function getJwtToken(): string | null {
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
  }
}

// I18n API methods
export const i18n = {
  async supported() {
    return fetchJson<Array<{ code: string; displayName: string }>>('/v1/i18n/supported')
  },
  
  async setCulture(culture: string) {
    return fetchJson('/v1/i18n/culture', {
      method: 'POST',
      body: JSON.stringify({ culture })
    })
  }
}

// Cases API methods
export const cases = {
  async mine() {
    return fetchJson('/v1/cases/mine')
  },
  
  async setPackage(caseId: string, packageId: string) {
    return fetchJson(`/v1/cases/${caseId}/package`, {
      method: 'POST',
      body: JSON.stringify({ packageId })
    })
  }
}

// Pricing API methods
export const pricing = {
  async get(visaType?: string, country?: string) {
    const params = new URLSearchParams()
    if (visaType) params.append('visaType', visaType)
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
    return fetchJson('/v1/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
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
    return fetchJson('/v1/messages/threads')
  },
  
  async thread(threadId: string) {
    return fetchJson(`/v1/messages/threads/${threadId}`)
  },
  
  async post(data: {
    threadId?: string
    recipientId?: string
    subject: string
    content: string
    priority?: 'low' | 'medium' | 'high'
  }) {
    return fetchJson('/v1/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async markRead(messageId: string) {
    return fetchJson(`/v1/messages/${messageId}/read`, {
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
export const interview = {
  async start(caseId: string) {
    return fetchJson('/v1/interview/start', {
      method: 'POST',
      body: JSON.stringify({ caseId })
    })
  },
  
  async answer(data: {
    sessionId: string
    stepNumber: number
    questionKey: string
    answerValue: string
  }) {
    return fetchJson('/v1/interview/answer', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  async complete(sessionId: string) {
    return fetchJson('/v1/interview/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    })
  },
  
  async rerun(caseId: string) {
    return fetchJson('/v1/interview/rerun', {
      method: 'POST',
      body: JSON.stringify({ caseId })
    })
  },
  
  async lock(caseId: string) {
    return fetchJson('/v1/interview/lock', {
      method: 'POST',
      body: JSON.stringify({ caseId })
    })
  },
  
  async history() {
    return fetchJson('/v1/interview/history')
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
  }
}

// Export the main fetchJson function and error class
export { fetchJson, ApiError }
export default fetchJson
