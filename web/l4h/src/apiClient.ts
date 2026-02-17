
// Use relative URL so it works in both development and production
// In development, Vite proxy will forward to localhost:8765
// In production, it will use the same domain
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = {
  startInterview: async () => {
    const response = await fetch(`${API_BASE_URL}/interview/start`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to start interview');
    }
    return response.json();
  },

  getNextQuestion: async (sessionId: string, answers: Record<string, string>) => {
    const response = await fetch(`${API_BASE_URL}/interview/next-question`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, answers }),
      });
    if (!response.ok) {
      throw new Error('Failed to get next question');
    }
    return response.json();
  },

  answerQuestion: async (sessionId: string, questionKey: string, answer: string) => {
    const response = await fetch(`${API_BASE_URL}/interview/answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, questionKey, answer }),
      });
    if (!response.ok) {
      throw new Error('Failed to answer question');
    }
    return response.json();
  },

  getMyVerifiedDocuments: async () => {
    const response = await fetch(`${API_BASE_URL}/documents/mine/verified`);
    if (!response.ok) throw new Error('Failed to fetch verified documents');
    return response.json();
  },

  // Document Pool Management
  getDocumentPoolByStatus: async (status: number) => {
    const response = await fetch(`${API_BASE_URL}/documentpool/status/${status}`);
    if (!response.ok) throw new Error('Failed to fetch document pool');
    return response.json();
  },

  getUnassignedDocuments: async () => {
    const response = await fetch(`${API_BASE_URL}/documentpool/unassigned`);
    if (!response.ok) throw new Error('Failed to fetch unassigned documents');
    return response.json();
  },

  verifyDocument: async (id: string, request: any) => {
    const response = await fetch(`${API_BASE_URL}/documentpool/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to verify document');
    return response.json();
  },

  assignDocument: async (id: string, request: any) => {
    const response = await fetch(`${API_BASE_URL}/documentpool/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to assign document');
    return response.json();
  },

  // Document Interview
  getDocumentInterviewFields: async (formId: string) => {
    const response = await fetch(`${API_BASE_URL}/documentinterview/forms/${formId}/fields`);
    if (!response.ok) throw new Error('Failed to fetch form fields');
    return response.json();
  },

  assembleDocument: async (formId: string, answers: Record<string, string>) => {
    const response = await fetch(`${API_BASE_URL}/documentinterview/forms/${formId}/assemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    });
    if (!response.ok) throw new Error('Failed to assemble document');
    return response.blob();
  },

  // Attorney Photo Management
  getAttorneyPhotos: async (attorneyId: number) => {
    const response = await fetch(`${API_BASE_URL}/attorneys/${attorneyId}/photos`);
    if (!response.ok) throw new Error('Failed to fetch attorney photos');
    return response.json();
  },

  uploadAttorneyPhoto: async (attorneyId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/attorneys/${attorneyId}/photos/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload photo');
    return response.json();
  },

  setPrimaryPhoto: async (attorneyId: number, photoId: string) => {
    const response = await fetch(`${API_BASE_URL}/attorneys/${attorneyId}/photos/${photoId}/primary`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to set primary photo');
    return response.json();
  },

  deleteAttorneyPhoto: async (attorneyId: number, photoId: string) => {
    const response = await fetch(`${API_BASE_URL}/attorneys/${attorneyId}/photos/${photoId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete photo');
    return true;
  },

  // Payments
  createCheckoutSession: async (caseId: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      }),
    });
    if (!response.ok) throw new Error('Failed to create checkout session');
    return response.json();
  },
};
