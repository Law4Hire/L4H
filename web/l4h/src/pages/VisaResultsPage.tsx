import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, useToast } from '@l4h/shared-ui';
import { interview } from '@l4h/shared-ui';

// This should match the DTO from the backend
interface VisaEvaluation {
  visaTypeId: number;
  visaName: string;
  visaCode: string;
  status: string;
  matchScore: number;
  explanation: string;
}

const VisaResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError, success: showSuccess } = useToast();

  const [evaluations, setEvaluations] = useState<VisaEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisaCode, setSelectedVisaCode] = useState<string | null>(null);

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
        
        // Auto-select the first eligible visa if it exists
        const eligible = results.find((r: VisaEvaluation) => r.status === 'Eligible');
        if (eligible) {
            setSelectedVisaCode(eligible.visaCode);
        }
      } catch (err: any) {
        console.error('Failed to fetch evaluations:', err);
        showError(err.message || 'Failed to load results.');
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

  const handleRegister = async () => {
    const selectedVisa = evaluations.find(e => e.visaCode === selectedVisaCode);
    
    // If no visa selected, but user wants to consult, they can still register
    const visaTypeId = selectedVisa?.visaTypeId || 0;
    
    try {
        // Save the selection to the backend interview session
        if (visaTypeId > 0) {
            await interview.selectVisa(sessionToken, visaTypeId);
        }
        navigate('/register-interview', { state: { sessionToken, selectedVisaCode } });
    } catch (err: any) {
        console.error('Failed to save visa selection:', err);
        // Handle validation error object specifically if it exists
        const msg = err.errors 
            ? Object.values(err.errors).flat().join(' ') 
            : (err.message || 'Failed to save your selection.');
        showError('Registration Error', msg);
    }
  };

  const renderResults = () => {
    if (isLoading) {
      return <div className="text-center dark:text-gray-300"><p>Loading results...</p></div>;
    }

    const eligibleVisas = evaluations.filter(e => e.status === 'Eligible');
    const potentialVisas = evaluations.filter(e => e.status === 'Potential');

    if (eligibleVisas.length === 0 && potentialVisas.length === 0) {
      const firstNotEligible = evaluations.find(e => e.status === 'NotEligible');
      const displayMessage = firstNotEligible?.explanation || 'Based on the answers provided, we could not find a suitable visa option at this time.';
      
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">No Eligible Visas Found</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
            <p className="text-red-800 dark:text-red-400 text-lg">
              {displayMessage}
            </p>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Even if you don't qualify for automated processing, you can still sign up for a consultation with our legal professionals to appeal your case or explore other complex options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleReturnHome} variant="secondary" size="lg">
              Return to Home
            </Button>
            <Button onClick={handleRegister} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Register for Consultation
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Your Visa Eligibility Results</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Please select the visa you would like to apply for to continue.</p>

        {/* Eligible visas - Light pale green box */}
        {eligibleVisas.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-4">You Qualify For:</h2>
            {eligibleVisas.map((visa, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <label className="flex items-start justify-between cursor-pointer p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  <div className="flex items-start flex-1">
                    <div className="mt-1 mr-4">
                        <input 
                            type="radio" 
                            name="visaSelection" 
                            value={visa.visaCode}
                            checked={selectedVisaCode === visa.visaCode}
                            onChange={() => setSelectedVisaCode(visa.visaCode)}
                            className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-900 dark:text-green-300">{visa.visaName}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mt-2">{visa.explanation}</p>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="inline-block bg-green-600 dark:bg-green-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {Math.round(visa.matchScore)}% Match
                    </span>
                  </div>
                </label>
                {index < eligibleVisas.length - 1 && (
                  <hr className="mt-4 border-green-200 dark:border-green-800/50" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Potential visas - Light pale blue box */}
        {potentialVisas.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-4">Potential Options (May Qualify):</h2>
            {potentialVisas.map((visa, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <label className="flex items-start justify-between cursor-pointer p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  <div className="flex items-start flex-1">
                    <div className="mt-1 mr-4">
                        <input 
                            type="radio" 
                            name="visaSelection" 
                            value={visa.visaCode}
                            checked={selectedVisaCode === visa.visaCode}
                            onChange={() => setSelectedVisaCode(visa.visaCode)}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300">{visa.visaName}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mt-2">{visa.explanation}</p>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="inline-block bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {Math.round(visa.matchScore)}% Match
                    </span>
                  </div>
                </label>
                {index < potentialVisas.length - 1 && (
                  <hr className="mt-4 border-blue-200 dark:border-blue-800/50" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Three action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleReturnHome} variant="secondary" size="lg">
            Return to Home
          </Button>
          <Button onClick={handleRedoInterview} variant="secondary" size="lg">
            Redo Interview
          </Button>
          <Button 
            onClick={handleRegister} 
            size="lg"
            disabled={!selectedVisaCode}
            className={!selectedVisaCode ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Select & Register
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {renderResults()}
      </div>
    </div>
  );
};

export default VisaResultsPage;
