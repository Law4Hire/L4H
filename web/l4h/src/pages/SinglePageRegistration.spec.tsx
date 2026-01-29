import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import React from 'react';
import { interview, ToastProvider } from '@l4h/shared-ui';
import SinglePageRegistration from './SinglePageRegistration';

// Mock the API client
vi.mock('@l4h/shared-ui', async () => {
    const original = await vi.importActual('@l4h/shared-ui');
    return {
        ...original,
        interview: {
            registerWithInterview: vi.fn(),
        },
    };
});

describe('SinglePageRegistration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(interview.registerWithInterview).mockResolvedValue({
            success: true,
            sessionId: 'new-session-id',
            userId: 'new-user-id',
            email: 'test@test.com',
        });
    });

    it('should render the registration form', () => {
        render(
            <MemoryRouter initialEntries={['/register-interview']}>
                <ToastProvider><Routes>
                    <Route path="/register-interview" element={<SinglePageRegistration />} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should show validation errors for empty fields', async () => {
        render(
            <MemoryRouter initialEntries={['/register-interview']}>
                <ToastProvider><Routes>
                    <Route path="/register-interview" element={<SinglePageRegistration />} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Create Account & See Results'));

        await waitFor(() => {
            expect(screen.getByText('First name is required')).toBeInTheDocument();
            expect(screen.getByText('Last name is required')).toBeInTheDocument();
            expect(screen.getByText('Invalid email address')).toBeInTheDocument();
        });
    });

    it('should call registerWithInterview and show success on submission', async () => {
        render(
            <MemoryRouter initialEntries={[{ pathname: '/register-interview', state: { sessionToken: 'test-token' } }]}>
                <ToastProvider><Routes>
                    <Route path="/register-interview" element={<SinglePageRegistration />} />
                </Routes></ToastProvider>
            </MemoryRouter>
        );

        fireEvent.input(screen.getByLabelText('First Name'), { target: { value: 'John' } });
        fireEvent.input(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
        fireEvent.input(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@test.com' } });
        fireEvent.input(screen.getByLabelText('Password'), { target: { value: 'password123' } });
        fireEvent.input(screen.getByLabelText('Phone Number'), { target: { value: '1234567890' } });
        fireEvent.input(screen.getByLabelText('Date of Birth'), { target: { value: '1990-01-01' } });
        fireEvent.input(screen.getByLabelText('Country of Citizenship'), { target: { value: 'USA' } });

        fireEvent.click(screen.getByText('Create Account & See Results'));

        await waitFor(() => {
            expect(interview.registerWithInterview).toHaveBeenCalled();
            expect(screen.getByText('Account Created Successfully!')).toBeInTheDocument();
        });
    });
});
