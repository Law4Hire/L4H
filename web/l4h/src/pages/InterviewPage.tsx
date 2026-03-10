import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast, ChevronLeft, Button } from '@l4h/shared-ui';
import { useInterview } from '../InterviewContext';
import { DocumentUploadQuestion } from '../components/interview/DocumentUploadQuestion';
import { AttorneyQuestionPage } from '../components/interview/AttorneyQuestionPage';

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

  // Use centralized state and actions from the InterviewProvider (AgentOrchestrator stream)
  const {
    sessionToken,
    currentQuestion,
    visaEvaluations,
    isComplete,
    isLoading,
    error: interviewError,
    startInterview,
    resumeInterview,
    submitAnswer
  } = useInterview();

  // Navigate to results page when interview is complete
  useEffect(() => {
    if (isComplete && sessionToken) {
      navigate('/results', { state: { sessionToken } });
    }
  }, [isComplete, sessionToken, navigate]);

  // Sync provider errors with UI toasts
  useEffect(() => {
    if (interviewError) {
      showError(interviewError);
    }
  }, [interviewError, showError]);

  // Initialize: Start or resume interview on load
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      resumeInterview(token);
    } else {
      startInterview();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDocumentUploadComplete = async (_uploadedFiles: UploadedFile[]) => {
    // Document upload acts as a regular question - proceed to next
    await submitAnswer('documents_uploaded');
  };

  const renderQuestion = () => {
    if (isLoading) {
      return (
        <div className="text-center dark:text-gray-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl animate-pulse">Law4Hire Agent is thinking...</p>
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="text-center dark:text-gray-300">
          <p className="mb-6 text-lg font-medium text-gray-600 dark:text-gray-400">
            No question available to display.
          </p>
          <button
            onClick={startInterview}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105"
          >
            Restart Interview
          </button>
        </div>
      );
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
            onRetakeInterview={startInterview}
            onRegister={() => navigate('/register', {
              state: { sessionToken, visaEvaluations }
            })}
            onScheduleMeeting={() => navigate('/schedule-meeting', {
              state: { sessionToken, visaEvaluations }
            })}
          />
        );

      case 'text':
      case 'textarea':
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                {currentQuestion.category || 'AI Analysis'}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {currentQuestion.text}
              </h2>
            </div>
            
            <div className="flex flex-col space-y-4">
              {currentQuestion.inputType === 'textarea' ? (
                <textarea
                  className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-[150px]"
                  placeholder="Type your answer here..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      submitAnswer((e.target as HTMLTextAreaElement).value);
                    }
                  }}
                />
              ) : (
                <input
                  type="text"
                  className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Type your answer here..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitAnswer((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement | HTMLTextAreaElement);
                    submitAnswer(input.value);
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );

      case 'select':
      case 'radio':
      case 'checkbox':
      default:
        return (
          <div>
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                {currentQuestion.category || 'AI Analysis'}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {currentQuestion.text}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => submitAnswer(option.value)}
                  className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all text-left group flex flex-col"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {option.label}
                  </h3>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 md:p-12 transition-colors border border-white/10">
          {!isComplete && !isLoading && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 font-semibold transition-colors"
            >
              <ChevronLeft size={20} className="mr-1" />
              Back
            </button>
          )}
          
          {isComplete ? (
            <div className="text-center py-10">
              <div className="animate-bounce mb-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Interview Complete!</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Our AI Agent has finalized its analysis.
              </p>
            </div>
          ) : renderQuestion()}
        </div>

        <div className="text-center mt-8 text-gray-500 dark:text-gray-500 text-sm">
          <p>© 2026 Cann Legal Group. AI-Powered Immigration Orchestrator.</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
