import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { interview, ToastProvider } from '@l4h/shared-ui';
import VisaResultsPage from './VisaResultsPage';

// Mock the API client
vi.mock('@l4h/shared-ui', async () => {
    const original = await vi.importActual('@l4h/shared-ui') as any;
    return {
        ...original,
        interview: {
            ...original.interview,
            getEvaluations: vi.fn(),
        },
    };
});

describe('VisaResultsPage', () => {
    const mockEvaluations = [
        {
            visaName: 'H-1B Visa',
            status: 'Eligible',
            matchScore: 95,
            explanation: 'You meet all the requirements.',
        },
        {
            visaName: 'O-1 Visa',
            status: 'Potential',
            matchScore: 75,
            explanation: 'You meet most of the requirements.',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display evaluation results when the API call is successful', async () => {
        vi.mocked(interview.getEvaluations).mockResolvedValue(mockEvaluations);

        render(
            <MemoryRouter initialEntries={[{ pathname: '/results', state: { sessionToken: 'test-token' } }]}>
                <ToastProvider><Routes>
                    <Route path="/results" element={<VisaResultsPage />} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('H-1B Visa')).toBeInTheDocument();
            expect(screen.getByText('95% Match')).toBeInTheDocument();
        });
    });

    it('should display a message when no eligible visas are found', async () => {
        vi.mocked(interview.getEvaluations).mockResolvedValue([]);

        render(
            <MemoryRouter initialEntries={[{ pathname: '/results', state: { sessionToken: 'test-token' } }]}>
                <ToastProvider><Routes>
                    <Route path="/results" element={<VisaResultsPage />} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('No Eligible Visas Found')).toBeInTheDocument();
        });
    });

    it('should navigate to the registration page when the button is clicked', async () => {
        vi.mocked(interview.getEvaluations).mockResolvedValue(mockEvaluations);

        render(
            <MemoryRouter initialEntries={[{ pathname: '/results', state: { sessionToken: 'test-token' } }]}>
                <ToastProvider><Routes>
                    <Route path="/results" element={<VisaResultsPage />} />
                    <Route path="/register-interview" element={<div>Registration Page</div>} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('H-1B Visa')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Register'));

        await waitFor(() => {
            expect(screen.getByText('Registration Page')).toBeInTheDocument();
        });
    });
});
