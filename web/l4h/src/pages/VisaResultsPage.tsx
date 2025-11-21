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

  const renderResults = () => {
    if (isLoading) {
      return <div className="text-center"><p>Loading results...</p></div>;
    }

    if (evaluations.length === 0) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Eligible Visas Found</h2>
          <p className="text-gray-600">
            Based on the answers provided, we could not find a suitable visa option at this time.
          </p>
        </div>
      );
    }

    const eligibleVisas = evaluations.filter(e => e.status === 'Eligible');

    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Your Visa Eligibility Results</h1>
        
        {eligibleVisas.map((visa, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 mb-4">
            <h2 className="text-2xl font-semibold text-blue-600">{visa.visaName}</h2>
            <p className="text-lg text-gray-700 mt-2">{visa.explanation}</p>
            <div className="text-right mt-4 font-bold text-xl">
              Match Score: <span className="text-green-500">{Math.round(visa.matchScore)}%</span>
            </div>
          </div>
        ))}

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/register-interview', { state: { sessionToken } })} size="lg">
            Register to Proceed
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
