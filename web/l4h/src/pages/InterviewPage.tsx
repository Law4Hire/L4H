import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, useToast } from '@l4h/shared-ui';
import { interview } from '@l4h/shared-ui';
import { ChevronLeft } from 'lucide-react';

// Simplified Question interface to match the backend DTO
interface Question {
  key: string;
  text: string;
  category: string;
  inputType: string;
  options: Array<{ value: string; label:string }>;
}

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  // API-driven state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Start the interview on component mount
  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    try {
      setIsLoading(true);
      // Use the English-only requirement
      const response = await interview.startAnonymous("en-US");
      setSessionToken(response.sessionToken);
      setCurrentQuestion(response.firstQuestion);
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      showError(error.message || 'Failed to start the interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        setIsComplete(true);
        setCurrentQuestion(null);
        // User wants to stop before the "green section".
        // For now, we will show a completion message.
        // The next step will be to navigate to the results page.
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

  const renderQuestion = () => {
    if (isLoading) {
      return <div className="text-center"><p>Loading...</p></div>;
    }

    if (!currentQuestion) {
      // This case should ideally not be hit if not complete, but as a fallback:
      return <div className="text-center"><p>No question to display.</p></div>;
    }

    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">{currentQuestion.text}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
            >
              <h3 className="text-xl font-semibold">{option.label}</h3>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  const renderCompletion = () => {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Interview Complete!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Thank you for completing the initial assessment.
        </p>
        <Button onClick={() => navigate('/dashboard')} size="lg">
          See My Results
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12">
          {!isComplete && !isLoading && (
            <button
              onClick={startInterview} // Back button restarts the interview for now
              className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-semibold"
            >
              <ChevronLeft size={20} className="mr-1" />
              Back
            </button>
          )}
          
          {isComplete ? renderCompletion() : renderQuestion()}
        </div>

        <div className="text-center mt-6 text-gray-600">
          <p>© 2025 Immigration Law Firm. Confidential consultation.</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;