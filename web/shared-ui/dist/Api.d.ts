export interface ApiResponse<T = any> {
    data?: T;
    title?: string;
    detail?: string;
    status?: number;
}
export interface Case {
    id: string;
    userId: string;
    status: string;
    createdAt: string;
    lastActivityAt: string;
}
export interface Appointment {
    id: string;
    caseId: string;
    staffUserId: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    type: string;
}
export interface Message {
    id: string;
    threadId: string;
    senderId: string;
    body: string;
    sentAt: string;
}
export interface Upload {
    id: string;
    caseId: string;
    key: string;
    status: string;
    createdAt: string;
}
export interface Pricing {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
}
export declare class ApiClient {
    getMyCases(): Promise<Case[]>;
    getCase(caseId: string): Promise<Case>;
    getMyAppointments(): Promise<Appointment[]>;
    getStaffAppointments(): Promise<Appointment[]>;
    createAppointment(appointment: Partial<Appointment>): Promise<Appointment>;
    getMessages(threadId: string): Promise<Message[]>;
    sendMessage(threadId: string, body: string): Promise<Message>;
    getUploads(caseId: string): Promise<Upload[]>;
    createUpload(caseId: string, fileName: string): Promise<{
        uploadUrl: string;
        key: string;
    }>;
    confirmUpload(key: string): Promise<Upload>;
    getPricing(): Promise<Pricing[]>;
    startInterview(): Promise<{
        interviewUrl: string;
    }>;
    healthCheck(): Promise<{
        status: string;
    }>;
}
export declare const apiClient: ApiClient;
