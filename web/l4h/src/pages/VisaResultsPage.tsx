import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, useToast } from '@l4h/shared-ui';
import { interview } from '@l4h/shared-ui';

// This should match the DTO from the backend
interface VisaEvaluation {
  visaName: string;
  status: string;
  matchScore: number;
  explanation: string;
}

const VisaResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError } = useToast();

  const [evaluations, setEvaluations] = useState<VisaEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sessionToken = location.state?.sessionToken;

  useEffect(() => {
    if (!sessionToken) {
      showError('No session token found. Please complete the interview first.');
      navigate('/interview');
      return;
    }

    const fetchEvaluations = async () => {
      try {
        setIsLoading(true);
        const results = await interview.getEvaluations(sessionToken);
        setEvaluations(results);
      } catch (error: any) {
        console.error('Failed to fetch evaluations:', error);
        showError(error.message || 'Failed to load results.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [sessionToken, navigate, showError]);

  const handleRedoInterview = () => {
    navigate('/interview');
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleRegister = () => {
    navigate('/register-interview', { state: { sessionToken } });
  };

  const renderResults = () => {
    if (isLoading) {
      return <div className="text-center"><p>Loading results...</p></div>;
    }

    if (evaluations.length === 0) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Eligible Visas Found</h2>
          <p className="text-gray-600 mb-8">
            Based on the answers provided, we could not find a suitable visa option at this time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleReturnHome} variant="secondary" size="lg">
              Return to Home
            </Button>
            <Button onClick={handleRedoInterview} size="lg">
              Redo Interview
            </Button>
          </div>
        </div>
      );
    }

    const eligibleVisas = evaluations.filter(e => e.status === 'Eligible');

    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Your Visa Eligibility Results</h1>

        {/* Light pale green box with visa qualification information */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">You Qualify For:</h2>
          {eligibleVisas.map((visa, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-green-900">{visa.visaName}</h3>
                  <p className="text-gray-700 mt-2">{visa.explanation}</p>
                </div>
                <div className="ml-4 text-right">
                  <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {Math.round(visa.matchScore)}% Match
                  </span>
                </div>
              </div>
              {index < eligibleVisas.length - 1 && (
                <hr className="mt-4 border-green-200" />
              )}
            </div>
          ))}
        </div>

        {/* Three action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleReturnHome} variant="secondary" size="lg">
            Return to Home
          </Button>
          <Button onClick={handleRedoInterview} variant="secondary" size="lg">
            Redo Interview
          </Button>
          <Button onClick={handleRegister} size="lg">
            Register
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {renderResults()}
      </div>
    </div>
  );
};

export default VisaResultsPage;
