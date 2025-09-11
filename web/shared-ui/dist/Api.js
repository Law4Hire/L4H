import { authClient } from './AuthClient';
// API client class
export class ApiClient {
    // Cases API
    async getMyCases() {
        const response = await authClient.get('/v1/cases/mine');
        if (!response.ok) {
            throw new Error(`Failed to fetch cases: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    }
    async getCase(caseId) {
        const response = await authClient.get(`/v1/cases/${caseId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch case: ${response.status}`);
        }
        return await response.json();
    }
    // Appointments API
    async getMyAppointments() {
        const response = await authClient.get('/v1/appointments');
        if (!response.ok) {
            throw new Error(`Failed to fetch appointments: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    }
    async getStaffAppointments() {
        const response = await authClient.get('/v1/appointments/staff');
        if (!response.ok) {
            throw new Error(`Failed to fetch staff appointments: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    }
    async createAppointment(appointment) {
        const response = await authClient.post('/v1/appointments', appointment);
        if (!response.ok) {
            throw new Error(`Failed to create appointment: ${response.status}`);
        }
        return await response.json();
    }
    // Messages API
    async getMessages(threadId) {
        const response = await authClient.get(`/v1/messages/${threadId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    }
    async sendMessage(threadId, body) {
        const response = await authClient.post(`/v1/messages/${threadId}`, { body });
        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status}`);
        }
        return await response.json();
    }
    // Uploads API
    async getUploads(caseId) {
        const response = await authClient.get(`/v1/uploads?caseId=${caseId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch uploads: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    }
    async createUpload(caseId, fileName) {
        const response = await authClient.post('/v1/uploads', { caseId, fileName });
        if (!response.ok) {
            throw new Error(`Failed to create upload: ${response.status}`);
        }
        return await response.json();
    }
    async confirmUpload(key) {
        const response = await authClient.post(`/v1/uploads/${key}/confirm`);
        if (!response.ok) {
            throw new Error(`Failed to confirm upload: ${response.status}`);
        }
        return await response.json();
    }
    // Pricing API
    async getPricing() {
        const response = await authClient.get('/v1/pricing');
        if (!response.ok) {
            throw new Error(`Failed to fetch pricing: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
    }
    // Interview API
    async startInterview() {
        const response = await authClient.post('/v1/interview/start');
        if (!response.ok) {
            throw new Error(`Failed to start interview: ${response.status}`);
        }
        return await response.json();
    }
    // Health check
    async healthCheck() {
        const response = await authClient.get('/health');
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        return await response.json();
    }
}
// Global API client instance
export const apiClient = new ApiClient();
