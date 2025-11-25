declare class ApiError extends Error {
    title: string;
    detail?: string | undefined;
    status?: number | undefined;
    constructor(title: string, detail?: string | undefined, status?: number | undefined);
}
declare function fetchJson<T = any>(path: string, init?: RequestInit): Promise<T>;
export declare function setJwtToken(token: string | null): void;
export declare function getJwtToken(): string | null;
export declare function clearTokens(): void;
export declare const auth: {
    login(credentials: {
        email: string;
        password: string;
        rememberMe?: boolean;
    }): Promise<any>;
    signup(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<any>;
    remember(): Promise<any>;
    verify(token: string): Promise<any>;
    forgot(email: string): Promise<any>;
    reset(data: {
        token: string;
        newPassword: string;
    }): Promise<any>;
    logoutAll(): Promise<any>;
    logout(): Promise<any>;
    updateProfile(profileData: {
        phoneNumber?: string;
        streetAddress?: string;
        city?: string;
        stateProvince?: string;
        postalCode?: string;
        country?: string;
        nationality?: string;
        dateOfBirth?: string;
        maritalStatus?: string;
    }): Promise<any>;
};
export declare const cases: {
    mine(): Promise<any>;
    get(caseId: string): Promise<any>;
    setPackage(caseId: string, packageId: string): Promise<any>;
    resetVisaType(caseId: string): Promise<any>;
};
export declare const pricing: {
    get(visaType?: string, country?: string): Promise<any>;
};
export declare const appointments: {
    list(): Promise<any>;
    create(data: {
        caseId: string;
        scheduledAt: string;
        duration: number;
        notes?: string;
    }): Promise<any>;
    reschedule(appointmentId: string, data: {
        scheduledAt: string;
        reason?: string;
    }): Promise<any>;
    cancel(appointmentId: string, reason?: string): Promise<any>;
};
export declare const messages: {
    threads(): Promise<any>;
    thread(threadId: string): Promise<any>;
    post(data: {
        threadId?: string;
        recipientId?: string;
        subject: string;
        content: string;
        priority?: "low" | "medium" | "high";
    }): Promise<any>;
    markRead(messageId: string): Promise<any>;
};
export declare const uploads: {
    presign(data: {
        caseId: string;
        fileName: string;
        contentType: string;
        sizeBytes: number;
    }): Promise<any>;
    confirm(data: {
        caseId: string;
        fileName: string;
        uploadToken: string;
    }): Promise<any>;
    list(caseId: string): Promise<any>;
};
export declare const invoices: {
    list(caseId?: string): Promise<any>;
    download(invoiceId: string): Promise<any>;
};
export declare const interview: {
    startAnonymous(languageCode?: string): Promise<{
        sessionToken: string;
        sessionId: string;
        firstQuestion: {
            key: string;
            text: string;
            category: string;
            inputType: string;
            options: Array<{
                value: string;
                label: string;
            }>;
            isRequired: boolean;
            order: number;
        };
    }>;
    resumeAnonymous(sessionToken: string): Promise<{
        sessionId: string;
        previousAnswers: Array<{
            question: string;
            answer: string;
            answeredAt: string;
        }>;
        nextQuestion: any | null;
        isComplete: boolean;
        evaluations: any[] | null;
    }>;
    submitAnswer(sessionToken: string, questionKey: string, answer: string): Promise<{
        isComplete: boolean;
        nextQuestion: any | null;
        totalAnswers: number;
        remainingVisasCount: number;
    }>;
    complete(sessionToken: string): Promise<{
        sessionId: string;
        evaluations: Array<{
            visaTypeId: number;
            visaCode: string;
            visaName: string;
            status: string;
            matchScore: number;
            rank: number;
            explanation: string;
            missingInformation: string[];
            requiredDocuments: string[];
            keyBenefits: string[];
            isUserSelected: boolean;
            isAttorneyLocked: boolean;
            lockReason?: string;
        }>;
        totalQuestionsAnswered: number;
    }>;
    getEvaluations(sessionToken: string): Promise<any>;
    selectVisa(sessionToken: string, visaTypeId: number): Promise<any>;
    registerWithInterview(data: {
        anonymousToken: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        sessionId: string;
        userId: string;
        email: string;
        success: boolean;
        errorMessage?: string;
    }>;
};
export declare const professional: {
    lockVisa(data: {
        sessionId: string;
        visaTypeId: number;
        reason?: string;
    }): Promise<any>;
    unlockVisa(data: {
        sessionId: string;
        visaTypeId: number;
        reason?: string;
    }): Promise<any>;
    getSessionEvaluations(sessionId: string): Promise<{
        visaTypeId: number;
        visaCode: string;
        visaName: string;
        status: string;
        matchScore: number;
        rank: number;
        explanation: string;
        missingInformation: string[];
        requiredDocuments: string[];
        keyBenefits: string[];
        isUserSelected: boolean;
        isAttorneyLocked: boolean;
        lockReason?: string;
    }[]>;
    getSessionLockStatus(sessionId: string): Promise<{
        isLocked: boolean;
        lockedVisaTypeId?: number;
        lockedVisaName?: string;
        lockedReason?: string;
        lockedBy?: string;
        lockedAt?: string;
    }>;
};
export declare const admin: {
    pricing(): Promise<any>;
    updatePricing(data: any): Promise<any>;
    workflows(): Promise<any>;
    approveWorkflow(workflowId: string): Promise<any>;
    rejectWorkflow(workflowId: string, reason: string): Promise<any>;
    timeEntries(): Promise<any>;
    approveTimeEntry(entryId: string): Promise<any>;
    rejectTimeEntry(entryId: string, reason: string): Promise<any>;
    reports(type: string, dateRange: {
        from: string;
        to: string;
    }): Promise<any>;
    users(): Promise<any>;
    updateUserRoles(userId: string, roles: {
        isAdmin: boolean;
        isStaff: boolean;
    }): Promise<any>;
    deleteUser(userId: string): Promise<any>;
    changeUserPassword(userId: string, newPassword: string): Promise<any>;
    changeUserStatus(userId: string, isActive: boolean): Promise<any>;
};
export { fetchJson, ApiError };
export default fetchJson;
