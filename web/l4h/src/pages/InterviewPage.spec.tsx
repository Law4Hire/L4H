import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import React from 'react';
import { interview, ToastProvider } from '@l4h/shared-ui';
import InterviewPage from './InterviewPage';
import VisaResultsPage from './VisaResultsPage'; // To test navigation

// Mock the API client
vi.mock('@l4h/shared-ui', async () => {
    const original = await vi.importActual('@l4h/shared-ui');
    return {
        ...original,
        interview: {
            startAnonymous: vi.fn(),
            submitAnswer: vi.fn(),
            getEvaluations: vi.fn(),
            complete: vi.fn(),
        },
    };
});

describe('InterviewPage', () => {
    const firstQuestion = {
        key: 'location',
        text: 'Where are you currently located?',
        category: 'initial',
        inputType: 'select',
        options: [
            { value: 'inside_us', label: 'Inside the United States' },
            { value: 'outside_us', label: 'Outside the United States' },
        ],
        isRequired: true,
        order: 1
    };

    const secondQuestion = {
        key: 'status',
        text: 'What is your current status?',
        category: 'initial',
        inputType: 'select',
        options: [{ value: 'citizen', label: 'U.S. Citizen' }],
        isRequired: true,
        order: 2
    };

    beforeEach(() => {
        vi.mocked(interview.startAnonymous).mockResolvedValue({
            sessionToken: 'test-token',
            sessionId: 'test-session-id',
            firstQuestion: firstQuestion,
        });
    });

    it('should start the interview on mount and display the first question', async () => {
        render(
            <MemoryRouter initialEntries={['/interview']}>
                <ToastProvider><Routes>
                    <Route path="/interview" element={<InterviewPage />} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        expect(interview.startAnonymous).toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.getByText('Where are you currently located?')).toBeInTheDocument();
        });
    });

    it('should call submitAnswer and display the next question when an answer is clicked', async () => {
        vi.mocked(interview.submitAnswer).mockResolvedValue({
            isComplete: false,
            nextQuestion: secondQuestion,
            totalAnswers: 1,
            remainingVisasCount: 10
        });

        render(
            <MemoryRouter initialEntries={['/interview']}>
                <ToastProvider><Routes>
                    <Route path="/interview" element={<InterviewPage />} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            fireEvent.click(screen.getByText('Inside the United States'));
        });

        expect(interview.submitAnswer).toHaveBeenCalledWith('test-token', 'location', 'inside_us');
        await waitFor(() => {
            expect(screen.getByText('What is your current status?')).toBeInTheDocument();
        });
    });

    it('should navigate to the results page on completion', async () => {
        vi.mocked(interview.submitAnswer).mockResolvedValue({
            isComplete: true,
            nextQuestion: null,
            totalAnswers: 5,
            remainingVisasCount: 1
        });

        render(
            <MemoryRouter initialEntries={['/interview']}>
                <ToastProvider><Routes>
                    <Route path="/interview" element={<InterviewPage />} />
                    <Route path="/results" element={<div>Results Page</div>} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            fireEvent.click(screen.getByText('Inside the United States'));
        });
        
        await waitFor(() => {
            expect(screen.getByText('Results Page')).toBeInTheDocument();
        });
    });
});
