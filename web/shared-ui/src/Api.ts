import { authClient } from './AuthClient'

// API response types
export interface ApiResponse<T = any> {
  data?: T
  title?: string
  detail?: string
  status?: number
}

export interface Case {
  id: string
  userId: string
  status: string
  createdAt: string
  lastActivityAt: string
}

export interface Appointment {
  id: string
  caseId: string
  staffUserId: string
  scheduledStart: string
  scheduledEnd: string
  status: string
  type: string
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  body: string
  sentAt: string
}

export interface Upload {
  id: string
  caseId: string
  key: string
  status: string
  createdAt: string
}

export interface Pricing {
  id: string
  name: string
  description: string
  price: number
  currency: string
}

// API client class
export class ApiClient {
  // Cases API
  async getMyCases(): Promise<Case[]> {
    const response = await authClient.get('/v1/cases/mine')
    if (!response.ok) {
      throw new Error(`Failed to fetch cases: ${response.status}`)
    }
    const data = await response.json()
    return data || []
  }

  async getCase(caseId: string): Promise<Case> {
    const response = await authClient.get(`/v1/cases/${caseId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch case: ${response.status}`)
    }
    return await response.json()
  }

  // Appointments API
  async getMyAppointments(): Promise<Appointment[]> {
    const response = await authClient.get('/v1/appointments')
    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.status}`)
    }
    const data = await response.json()
    return data || []
  }

  async getStaffAppointments(): Promise<Appointment[]> {
    const response = await authClient.get('/v1/appointments/staff')
    if (!response.ok) {
      throw new Error(`Failed to fetch staff appointments: ${response.status}`)
    }
    const data = await response.json()
    return data || []
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    const response = await authClient.post('/v1/appointments', appointment)
    if (!response.ok) {
      throw new Error(`Failed to create appointment: ${response.status}`)
    }
    return await response.json()
  }

  // Messages API
  async getMessages(threadId: string): Promise<Message[]> {
    const response = await authClient.get(`/v1/messages/${threadId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`)
    }
    const data = await response.json()
    return data || []
  }

  async sendMessage(threadId: string, body: string): Promise<Message> {
    const response = await authClient.post(`/v1/messages/${threadId}`, { body })
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`)
    }
    return await response.json()
  }

  // Uploads API
  async getUploads(caseId: string): Promise<Upload[]> {
    const response = await authClient.get(`/v1/uploads?caseId=${caseId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch uploads: ${response.status}`)
    }
    const data = await response.json()
    return data || []
  }

  async createUpload(caseId: string, fileName: string): Promise<{ uploadUrl: string; key: string }> {
    const response = await authClient.post('/v1/uploads', { caseId, fileName })
    if (!response.ok) {
      throw new Error(`Failed to create upload: ${response.status}`)
    }
    return await response.json()
  }

  async confirmUpload(key: string): Promise<Upload> {
    const response = await authClient.post(`/v1/uploads/${key}/confirm`)
    if (!response.ok) {
      throw new Error(`Failed to confirm upload: ${response.status}`)
    }
    return await response.json()
  }

  // Pricing API
  async getPricing(): Promise<Pricing[]> {
    const response = await authClient.get('/v1/pricing')
    if (!response.ok) {
      throw new Error(`Failed to fetch pricing: ${response.status}`)
    }
    const data = await response.json()
    return data || []
  }

  // Interview API
  async startInterview(): Promise<{ interviewUrl: string }> {
    const response = await authClient.post('/v1/interview/start')
    if (!response.ok) {
      throw new Error(`Failed to start interview: ${response.status}`)
    }
    return await response.json()
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await authClient.get('/health')
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }
    return await response.json()
  }
}

// Global API client instance
export const apiClient = new ApiClient()
