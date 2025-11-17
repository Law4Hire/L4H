class ApiError extends Error {
    constructor(title, detail, status) {
        super(detail || title);
        Object.defineProperty(this, "title", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: title
        });
        Object.defineProperty(this, "detail", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: detail
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        this.name = 'ApiError';
    }
}
// JWT token stored in memory
let jwtToken = null;
// Initialize JWT token from localStorage on module load
if (typeof window !== 'undefined') {
    jwtToken = localStorage.getItem('jwt_token');
}
// CSRF token cache
let csrfToken = null;
let csrfTokenExpiry = 0;
// Cookie endpoints that require CSRF token
const COOKIE_ENDPOINTS = [
    '/v1/auth/login',
    '/v1/auth/remember',
    '/v1/i18n/culture'
];
// Get CSRF token
async function getCsrfToken() {
    const now = Date.now();
    // Return cached token if still valid (5 minutes)
    if (csrfToken && now < csrfTokenExpiry) {
        return csrfToken;
    }
    try {
        const response = await fetch('/api/v1/auth/csrf', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to get CSRF token');
        }
        const data = await response.json();
        csrfToken = data.token;
        csrfTokenExpiry = now + (5 * 60 * 1000); // 5 minutes
        return csrfToken || '';
    }
    catch (error) {
        console.warn('Failed to get CSRF token:', error);
        return '';
    }
}
// Check if endpoint requires CSRF token
function requiresCsrfToken(path) {
    return COOKIE_ENDPOINTS.some(endpoint => path.includes(endpoint));
}
// Main fetch wrapper
async function fetchJson(path, init = {}) {
    const url = `/api${path}`;
    // Prepare headers
    const headers = {
        'Content-Type': 'application/json',
        ...init.headers
    };
    // Add JWT token if available - ensure we load from localStorage if needed
    const token = getJwtToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Add CSRF token for cookie endpoints
    if (requiresCsrfToken(path)) {
        const csrf = await getCsrfToken();
        if (csrf) {
            headers['X-CSRF-TOKEN'] = csrf;
        }
    }
    // Include credentials for cookie endpoints
    const credentials = requiresCsrfToken(path) ? 'include' : 'same-origin';
    try {
        const response = await fetch(url, {
            ...init,
            headers,
            credentials
        });
        // Handle non-JSON responses (like file downloads)
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            if (!response.ok) {
                throw new ApiError(`HTTP ${response.status}`, response.statusText, response.status);
            }
            return response;
        }
        const data = await response.json();
        if (!response.ok) {
            // Try to refresh token on 401 Unauthorized
            if (response.status === 401 && path !== '/v1/auth/remember' && path !== '/v1/auth/login') {
                try {
                    const refreshResponse = await fetch('/api/v1/auth/remember', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        if (refreshData.token) {
                            // Update the token and retry the original request
                            jwtToken = refreshData.token;
                            localStorage.setItem('jwt_token', refreshData.token);
                            // Retry the original request with new token
                            const retryHeaders = {
                                ...headers,
                                'Authorization': `Bearer ${jwtToken}`
                            };
                            const retryResponse = await fetch(url, {
                                ...init,
                                headers: retryHeaders,
                                credentials
                            });
                            if (retryResponse.ok) {
                                const retryContentType = retryResponse.headers.get('content-type');
                                if (!retryContentType?.includes('application/json')) {
                                    return retryResponse;
                                }
                                const retryData = await retryResponse.json();
                                return retryData.data || retryData;
                            }
                        }
                    }
                }
                catch (refreshError) {
                    // If refresh fails, fall through to original error handling
                    console.warn('Token refresh failed:', refreshError);
                }
            }
            const error = data.error || {
                title: `HTTP ${response.status}`,
                detail: response.statusText,
                status: response.status
            };
            throw new ApiError(error.title, error.detail, error.status);
        }
        return data.data || data;
    }
    catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Network or other errors
        throw new ApiError('Network Error', error instanceof Error ? error.message : 'Unknown error');
    }
}
// Set JWT token
export function setJwtToken(token) {
    jwtToken = token;
    if (token) {
        localStorage.setItem('jwt_token', token);
    }
    else {
        localStorage.removeItem('jwt_token');
    }
}
// Get current JWT token
export function getJwtToken() {
    if (!jwtToken) {
        jwtToken = localStorage.getItem('jwt_token');
    }
    return jwtToken;
}
// Clear tokens
export function clearTokens() {
    jwtToken = null;
    csrfToken = null;
    csrfTokenExpiry = 0;
}
// Auth API methods
export const auth = {
    async login(credentials) {
        return fetchJson('/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },
    async signup(userData) {
        return fetchJson('/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    async remember() {
        return fetchJson('/v1/auth/remember', {
            method: 'POST'
        });
    },
    async verify(token) {
        return fetchJson(`/v1/auth/verify?token=${encodeURIComponent(token)}`);
    },
    async forgot(email) {
        return fetchJson('/v1/auth/forgot', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },
    async reset(data) {
        return fetchJson('/v1/auth/reset', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async logoutAll() {
        return fetchJson('/v1/auth/logout-all', {
            method: 'POST'
        });
    },
    async updateProfile(profileData) {
        return fetchJson('/v1/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }
};
// I18n API methods
export const i18n = {
    async supported() {
        return fetchJson('/v1/i18n/supported');
    },
    async setCulture(culture) {
        return fetchJson('/v1/i18n/culture', {
            method: 'POST',
            body: JSON.stringify({ culture })
        });
    }
};
// Cases API methods
export const cases = {
    async mine() {
        return fetchJson('/v1/cases/mine');
    },
    async get(caseId) {
        return fetchJson(`/v1/cases/${caseId}`);
    },
    async setPackage(caseId, packageId) {
        return fetchJson(`/v1/cases/${caseId}/package`, {
            method: 'POST',
            body: JSON.stringify({ packageId })
        });
    },
    async resetVisaType(caseId) {
        return fetchJson(`/v1/cases/${caseId}/reset-visa-type`, {
            method: 'POST'
        });
    }
};
// Pricing API methods
export const pricing = {
    async get(visaType, country) {
        const params = new URLSearchParams();
        if (visaType)
            params.append('visaType', visaType);
        if (country)
            params.append('country', country);
        const query = params.toString();
        return fetchJson(`/v1/pricing${query ? `?${query}` : ''}`);
    }
};
// Appointments API methods
export const appointments = {
    async list() {
        return fetchJson('/v1/appointments');
    },
    async create(data) {
        return fetchJson('/v1/appointments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async reschedule(appointmentId, data) {
        return fetchJson(`/v1/appointments/${appointmentId}/reschedule`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async cancel(appointmentId, reason) {
        return fetchJson(`/v1/appointments/${appointmentId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }
};
// Messages API methods
export const messages = {
    async threads() {
        return fetchJson('/v1/messages/threads');
    },
    async thread(threadId) {
        return fetchJson(`/v1/messages/threads/${threadId}`);
    },
    async post(data) {
        return fetchJson('/v1/messages', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async markRead(messageId) {
        return fetchJson(`/v1/messages/${messageId}/read`, {
            method: 'POST'
        });
    }
};
// Uploads API methods
export const uploads = {
    async presign(data) {
        return fetchJson('/v1/uploads/presign', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async confirm(data) {
        return fetchJson('/v1/uploads/confirm', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async list(caseId) {
        return fetchJson(`/v1/uploads/list?caseId=${encodeURIComponent(caseId)}`);
    }
};
// Invoices API methods
export const invoices = {
    async list(caseId) {
        const params = caseId ? `?caseId=${encodeURIComponent(caseId)}` : '';
        return fetchJson(`/v1/invoices${params}`);
    },
    async download(invoiceId) {
        return fetchJson(`/v1/invoices/${invoiceId}/download`);
    }
};
// Interview API methods
// New unified interview API
export const interview = {
    // Start a new anonymous interview
    async startAnonymous(languageCode) {
        return fetchJson('/interview/anonymous/start', {
            method: 'POST',
            body: JSON.stringify({ languageCode })
        });
    },
    // Resume an existing anonymous interview
    async resumeAnonymous(sessionToken) {
        return fetchJson('/interview/anonymous/resume', {
            method: 'POST',
            body: JSON.stringify({ sessionToken })
        });
    },
    // Submit an answer and get next question
    async submitAnswer(sessionToken, questionKey, answer) {
        return fetchJson('/interview/anonymous/answer', {
            method: 'POST',
            body: JSON.stringify({ sessionToken, questionKey, answer })
        });
    },
    // Complete the interview and get evaluations
    async complete(sessionToken) {
        return fetchJson('/interview/anonymous/complete', {
            method: 'POST',
            body: JSON.stringify({ sessionToken })
        });
    },
    // Get visa evaluations for a session
    async getEvaluations(sessionToken) {
        return fetchJson(`/interview/anonymous/evaluations/${sessionToken}`);
    },
    // User selects their preferred visa
    async selectVisa(sessionToken, visaTypeId) {
        return fetchJson('/interview/anonymous/select-visa', {
            method: 'POST',
            body: JSON.stringify({ sessionToken, visaTypeId })
        });
    },
    // Create account with interview data
    async registerWithInterview(data) {
        return fetchJson('/interview/anonymous/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
// Admin API methods
export const admin = {
    async pricing() {
        return fetchJson('/v1/admin/pricing');
    },
    async updatePricing(data) {
        return fetchJson('/v1/admin/pricing', {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    async workflows() {
        return fetchJson('/v1/admin/workflows');
    },
    async approveWorkflow(workflowId) {
        return fetchJson(`/v1/admin/workflows/${workflowId}/approve`, {
            method: 'POST'
        });
    },
    async rejectWorkflow(workflowId, reason) {
        return fetchJson(`/v1/admin/workflows/${workflowId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    },
    async timeEntries() {
        return fetchJson('/v1/admin/time-entries');
    },
    async approveTimeEntry(entryId) {
        return fetchJson(`/v1/admin/time-entries/${entryId}/approve`, {
            method: 'POST'
        });
    },
    async rejectTimeEntry(entryId, reason) {
        return fetchJson(`/v1/admin/time-entries/${entryId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    },
    async reports(type, dateRange) {
        return fetchJson(`/v1/admin/reports/${type}`, {
            method: 'POST',
            body: JSON.stringify(dateRange)
        });
    },
    async users() {
        return fetchJson('/v1/admin/users');
    },
    async updateUserRoles(userId, roles) {
        return fetchJson(`/v1/admin/users/${userId}/roles`, {
            method: 'PUT',
            body: JSON.stringify(roles)
        });
    },
    async deleteUser(userId) {
        return fetchJson(`/v1/admin/users/${userId}`, {
            method: 'DELETE'
        });
    },
    async changeUserPassword(userId, newPassword) {
        return fetchJson(`/v1/admin/users/${userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({ newPassword })
        });
    },
    async changeUserStatus(userId, isActive) {
        return fetchJson(`/v1/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });
    }
};
// Export the main fetchJson function and error class
export { fetchJson, ApiError };
export default fetchJson;
