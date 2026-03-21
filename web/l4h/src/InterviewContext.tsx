import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { getErrorMessage, interview } from '@l4h/shared-ui';

interface Question {
  key: string;
  text: string;
  category: string;
  inputType: string;
  pageConfig?: string;
  options: Array<{ value: string; label: string }>;
}

interface VisaEvaluation {
  visaName: string;
  visaCode: string;
  status: string;
  matchScore: number;
  explanation: string;
  keyBenefits?: string[];
}

interface InterviewState {
  sessionToken: string | null;
  currentQuestion: Question | null;
  visaEvaluations: VisaEvaluation[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  startInterview: (initialAnswers?: Record<string, string>) => Promise<void>;
  resumeInterview: (token: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
}

const InterviewContext = createContext<InterviewState | undefined>(undefined);

export const InterviewProvider = ({ children }: { children: ReactNode }) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [visaEvaluations, setVisaEvaluations] = useState<VisaEvaluation[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startInterview = useCallback(async (initialAnswers?: Record<string, string>) => {
    try {
      setIsLoading(true);
      setError(null);
      // Clear stale local data
      setSessionToken(null);
      setCurrentQuestion(null);
      setVisaEvaluations([]);
      setIsComplete(false);

      // Check for fastpath answers and session ID in session storage if not provided directly
      const answers = initialAnswers || 
        JSON.parse(sessionStorage.getItem('fastpath_answers') || 'null');
      
      const existingSessionId = sessionStorage.getItem('fastpath_session_id') || undefined;

      const response = await interview.startAnonymous(answers, existingSessionId);
      setSessionToken(response.sessionToken);
      setCurrentQuestion(response.firstQuestion);
      
      // Clear session storage once consumed
      if (sessionStorage.getItem('fastpath_answers')) {
        sessionStorage.removeItem('fastpath_answers');
      }
      if (sessionStorage.getItem('fastpath_session_id')) {
        sessionStorage.removeItem('fastpath_session_id');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to start interview'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resumeInterview = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await interview.resumeAnonymous(token);
      setSessionToken(token);
      
      if (response.isComplete) {
        const evaluations = await interview.getEvaluations(token);
        setVisaEvaluations(evaluations);
        setIsComplete(true);
      } else {
        setCurrentQuestion(response.nextQuestion);
        setIsComplete(false);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resume interview'));
      // If resume fails, start a fresh one
      startInterview();
    } finally {
      setIsLoading(false);
    }
  }, [startInterview]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!sessionToken || !currentQuestion) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await interview.submitAnswer(
        sessionToken,
        currentQuestion.key,
        answer
      );

      if (response.isComplete) {
        const evaluations = await interview.getEvaluations(sessionToken);
        setVisaEvaluations(evaluations);
        setIsComplete(true);
        setCurrentQuestion(null);
      } else if (response.nextQuestion) {
        setCurrentQuestion(response.nextQuestion);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to submit answer'));
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, currentQuestion]);

  const value = {
    sessionToken,
    currentQuestion,
    visaEvaluations,
    isComplete,
    isLoading,
    error,
    startInterview,
    resumeInterview,
    submitAnswer
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
