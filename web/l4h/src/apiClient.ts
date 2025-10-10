
import { QueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:8765/api/v1'; // Assuming the API is served from the same domain

export const queryClient = new QueryClient();

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
