import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, useToast } from '@l4h/shared-ui';
import { interview } from '@l4h/shared-ui';
import { ChevronLeft } from 'lucide-react';
import { DocumentUploadQuestion } from '../components/interview/DocumentUploadQuestion';
import { AttorneyQuestionPage } from '../components/interview/AttorneyQuestionPage';

// Simplified Question interface to match the backend DTO
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

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'complete' | 'error';
  progress: number;
}

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error: showError } = useToast();

  // API-driven state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visaEvaluations, setVisaEvaluations] = useState<VisaEvaluation[]>([]);

  // Navigate to results page when interview is complete
  useEffect(() => {
    if (isComplete && sessionToken) {
      navigate('/results', { state: { sessionToken } });
    }
  }, [isComplete, sessionToken, navigate]);

  const startInterview = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // Use default language (English)
      const response = await interview.startAnonymous();
      setSessionToken(response.sessionToken);
      setCurrentQuestion(response.firstQuestion);
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      showError(error.message || 'Failed to start the interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const resumeInterview = React.useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const response = await interview.resumeAnonymous(token);
      setSessionToken(token);
      
      if (response.isComplete) {
        // Fetch visa evaluations
        try {
          const evaluations = await interview.getEvaluations(token);
          setVisaEvaluations(evaluations);
        } catch (evalError) {
          console.error('Failed to fetch visa evaluations:', evalError);
        }
        setIsComplete(true);
      } else {
        setCurrentQuestion(response.nextQuestion);
      }
    } catch (error: any) {
      console.error('Failed to resume interview:', error);
      // Fallback to starting a new interview if resume fails
      startInterview();
    } finally {
      setIsLoading(false);
    }
  }, [startInterview]);

  // Start or resume interview on load
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      resumeInterview(token);
    } else {
      startInterview();
    }
  }, [searchParams, resumeInterview, startInterview]);

  // Function to handle the "jump-on" UX
  const handleAnswer = async (answerValue: string) => {
    if (!sessionToken || !currentQuestion) return;

    try {
      setIsLoading(true);
      const response = await interview.submitAnswer(
        sessionToken,
        currentQuestion.key,
        answerValue
      );

      if (response.isComplete) {
        // Fetch visa evaluations before showing attorney question page
        try {
          const evaluations = await interview.getEvaluations(sessionToken);
          setVisaEvaluations(evaluations);
        } catch (evalError) {
          console.error('Failed to fetch visa evaluations:', evalError);
        }
        setIsComplete(true);
        setCurrentQuestion(null);
      } else if (response.nextQuestion) {
        setCurrentQuestion(response.nextQuestion);
      }
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      showError(error.message || 'Failed to submit answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUploadComplete = async (uploadedFiles: UploadedFile[]) => {
    if (!sessionToken || !currentQuestion) return;

    // Document upload acts as a regular question - proceed to next
    // The "answer" is just that upload was completed
    try {
      setIsLoading(true);
      const response = await interview.submitAnswer(
        sessionToken,
        currentQuestion.key,
        'documents_uploaded'  // Special value indicating completion
      );

      if (response.isComplete) {
        // Fetch visa evaluations
        try {
          const evaluations = await interview.getEvaluations(sessionToken);
          setVisaEvaluations(evaluations);
        } catch (evalError) {
          console.error('Failed to fetch visa evaluations:', evalError);
        }
        setIsComplete(true);
        setCurrentQuestion(null);
      } else if (response.nextQuestion) {
        setCurrentQuestion(response.nextQuestion);
      }
    } catch (error: any) {
      showError('Failed to proceed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = () => {
    if (isLoading) {
      return <div className="text-center dark:text-gray-300"><p>Loading...</p></div>;
    }

    if (!currentQuestion) {
      // This case should ideally not be hit if not complete, but as a fallback:
      return <div className="text-center dark:text-gray-300"><p>No question to display.</p></div>;
    }

    // Route to appropriate component based on input type
    switch (currentQuestion.inputType) {
      case 'document_upload':
        return (
          <DocumentUploadQuestion
            question={currentQuestion}
            sessionToken={sessionToken!}
            onComplete={handleDocumentUploadComplete}
          />
        );

      case 'attorney_question':
        return (
          <AttorneyQuestionPage
            question={currentQuestion}
            sessionToken={sessionToken!}
            visaEvaluations={visaEvaluations}
            onRetakeInterview={() => navigate('/interview')}
            onRegister={() => navigate('/register', {
              state: { sessionToken, visaEvaluations }
            })}
            onScheduleMeeting={() => navigate('/schedule-meeting', {
              state: { sessionToken, visaEvaluations }
            })}
          />
        );

      case 'select':
      case 'radio':
      case 'checkbox':
      case 'text':
      case 'textarea':
      default:
        // Existing option button rendering
        return (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{currentQuestion.text}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all text-left group"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{option.label}</h3>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 md:p-12 transition-colors">
          {!isComplete && !isLoading && (
            <button
              onClick={startInterview} // Back button restarts the interview for now
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 font-semibold transition-colors"
            >
              <ChevronLeft size={20} className="mr-1" />
              Back
            </button>
          )}
          
          {isComplete ? (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Interview Complete!</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Navigating to your results...
              </p>
            </div>
          ) : renderQuestion()}
        </div>

        <div className="text-center mt-6 text-gray-600 dark:text-gray-400">
          <p>© 2025 Immigration Law Firm. Confidential consultation.</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;