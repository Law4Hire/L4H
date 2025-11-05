
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
};
