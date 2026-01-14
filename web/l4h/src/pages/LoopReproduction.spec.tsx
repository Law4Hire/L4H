import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@l4h/shared-ui';
import VisaResultsPage from './VisaResultsPage';
import InterviewPage from './InterviewPage';
import { interview } from '@l4h/shared-ui';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API client
vi.mock('@l4h/shared-ui', async () => {
  const actual = await vi.importActual('@l4h/shared-ui') as any;
  return {
    ...actual,
    interview: {
      ...actual.interview,
      startAnonymous: vi.fn(),
      submitAnswer: vi.fn(),
      getEvaluations: vi.fn(),
    },
  };
});

describe('Infinite Loop Reproduction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not enter an infinite loop on the results page when fetch fails', async () => {
    // Mock fetch failure to trigger the error path
    const getEvaluationsMock = vi.mocked(interview.getEvaluations);
    getEvaluationsMock.mockRejectedValue(new Error('Simulated API Failure'));

    // Spy on console.error to count errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/results', state: { sessionToken: 'test-token' } }]}>
        <ToastProvider>
          <Routes>
            <Route path="/results" element={<VisaResultsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    // Wait for the first error
    await waitFor(() => {
      expect(getEvaluationsMock).toHaveBeenCalled();
    });

    // Wait a bit more to see if it loops
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check call count
    const callCount = getEvaluationsMock.mock.calls.length;
    console.log(`API Call Count: ${callCount}`);

    // If loop exists, callCount will be high (e.g., > 10 in 1 second)
    // If stable, it should be 1 (or maybe 2 due to strict mode double invocation)
    expect(callCount).toBeLessThan(5);

    consoleSpy.mockRestore();
  });
});
