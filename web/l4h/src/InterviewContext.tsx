
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface InterviewState {
  sessionId: string | null;
  currentQuestion: any; // Replace 'any' with a proper type for the question
  answers: Record<string, string>;
  isLoading: boolean;
  error: Error | null;
}

const InterviewContext = createContext<InterviewState | undefined>(undefined);

export const InterviewProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const value = {
    sessionId,
    currentQuestion,
    answers,
    isLoading,
    error,
    // Add methods to update the state here
  };

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
