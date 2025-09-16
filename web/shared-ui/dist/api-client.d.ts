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
    updateProfile(profileData: {
        phoneNumber?: string;
        streetAddress?: string;
        city?: string;
        stateProvince?: string;
        postalCode?: string;
        country?: string;
        nationality?: string;
    }): Promise<any>;
};
export declare const i18n: {
    supported(): Promise<{
        code: string;
        displayName: string;
    }[]>;
    setCulture(culture: string): Promise<any>;
};
export declare const cases: {
    mine(): Promise<any>;
    setPackage(caseId: string, packageId: string): Promise<any>;
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
    start(caseId: string): Promise<any>;
    answer(data: {
        sessionId: string;
        stepNumber: number;
        questionKey: string;
        answerValue: string;
    }): Promise<any>;
    complete(sessionId: string): Promise<any>;
    rerun(caseId: string): Promise<any>;
    lock(caseId: string): Promise<any>;
    history(): Promise<any>;
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
};
export { fetchJson, ApiError };
export default fetchJson;
