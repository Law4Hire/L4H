import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, useToast } from '@l4h/shared-ui';

interface Option {
  label: string;
  value: string;
  nextStep?: string;
  result?: 'GOOD_FIT' | 'TERMINATED' | 'DOCUMENTS' | 'RECOMMENDED_WIZARD';
  message?: string;
}

interface Step {
  id: string;
  question: string;
  options: Option[];
}

const SERVICE_FIT_TREE: Record<string, Step> = {
  start: {
    id: 'start',
    question: 'What is the primary type of service or status you are seeking?',
    options: [
      { label: 'Immigrant Visa (Permanent Residency / Green Card)', value: 'immigrant', nextStep: 'immigrant_basis' },
      { label: 'Non-Immigrant Visa (Temporary Visit / Work / Study)', value: 'non_immigrant', nextStep: 'non_immigrant_purpose' },
      { label: 'Document Preparation (Existing Status / Maintenance)', value: 'documents', nextStep: 'docs_existing_status' },
      { label: 'Humanitarian / Special Services (Refugee, Asylum, Adoption)', value: 'humanitarian', nextStep: 'humanitarian_type' },
    ],
  },
  // Immigrant Path
  immigrant_basis: {
    id: 'immigrant_basis',
    question: 'Do you have a qualifying basis for immigration (U.S. family member, U.S. job offer, or $800k+ to invest)?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'immigrant_hold' },
      { label: 'No (Seeking self-sponsorship)', value: 'no', nextStep: 'immigrant_extraordinary' },
    ],
  },
  immigrant_hold: {
    id: 'immigrant_hold',
    question: 'Are you a citizen of a country currently subject to a total U.S. administrative processing hold (e.g., Algeria)?',
    options: [
      { label: 'Yes', value: 'yes', result: 'TERMINATED', message: 'Country-wide hold prevents processing.' },
      { label: 'No', value: 'no', nextStep: 'immigrant_deportation' },
    ],
  },
  immigrant_deportation: {
    id: 'immigrant_deportation',
    question: 'Have you ever been deported from the U.S. or stayed past your visa expiry for more than 1 year?',
    options: [
      { label: 'Yes', value: 'yes', result: 'TERMINATED', message: 'Requires advanced litigation outside standard service scope.' },
      { label: 'No', value: 'no', nextStep: 'immigrant_criminal' },
    ],
  },
  immigrant_criminal: {
    id: 'immigrant_criminal',
    question: 'Have you ever been convicted of a felony or a "Crime Involving Moral Turpitude"?',
    options: [
      { label: 'Yes', value: 'yes', result: 'TERMINATED', message: 'Legal history requires specialized counsel.' },
      { label: 'No', value: 'no', result: 'GOOD_FIT' },
    ],
  },
  immigrant_extraordinary: {
    id: 'immigrant_extraordinary',
    question: 'Do you possess "Extraordinary Ability" or are you a person of "National Interest" to the U.S.?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'immigrant_awards' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'Permanent residency requires a specific sponsor or high-level skill.' },
    ],
  },
  immigrant_awards: {
    id: 'immigrant_awards',
    question: 'Can you provide documentation of national or international awards/recognition?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'immigrant_hold_2' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'Self-sponsorship requires specific high-level criteria.' },
    ],
  },
  immigrant_hold_2: {
    id: 'immigrant_hold_2',
    question: 'Are you a citizen of a country currently under administrative hold?',
    options: [
      { label: 'Yes', value: 'yes', result: 'TERMINATED', message: 'Country-wide hold prevents processing.' },
      { label: 'No', value: 'no', result: 'GOOD_FIT' },
    ],
  },
  // Non-Immigrant Path
  non_immigrant_purpose: {
    id: 'non_immigrant_purpose',
    question: 'Is your primary purpose for travel related to Business, Tourism, Academic Study, or Professional Work?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'non_immigrant_prereq' },
      { label: 'No (Other/Misc)', value: 'no', nextStep: 'non_immigrant_misc' },
    ],
  },
  non_immigrant_prereq: {
    id: 'non_immigrant_prereq',
    question: 'Do you have the specific prerequisite required for your path (Job offer, School acceptance, or proof of travel funds)?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'non_immigrant_intent' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'We cannot assist until a qualifying prerequisite is met.' },
    ],
  },
  non_immigrant_intent: {
    id: 'non_immigrant_intent',
    question: 'Do you intend to return to your home country upon the expiration of your temporary status?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'non_immigrant_fraud' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'Non-immigrant visas require "Non-immigrant Intent".' },
    ],
  },
  non_immigrant_fraud: {
    id: 'non_immigrant_fraud',
    question: 'Have you ever committed visa fraud or misrepresented facts to a U.S. official?',
    options: [
      { label: 'Yes', value: 'yes', result: 'TERMINATED', message: 'Legal barriers prevent automated processing.' },
      { label: 'No', value: 'no', result: 'GOOD_FIT' },
    ],
  },
  non_immigrant_misc: {
    id: 'non_immigrant_misc',
    question: 'Are you seeking a diplomatic, media, or international organization visa (A, G, or I)?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'non_immigrant_accreditation' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'We currently only support standard business, tourist, and student paths.' },
    ],
  },
  non_immigrant_accreditation: {
    id: 'non_immigrant_accreditation',
    question: 'Do you have an official invitation or accreditation from the organization?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'non_immigrant_hold' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'Accreditation is required for these categories.' },
    ],
  },
  non_immigrant_hold: {
    id: 'non_immigrant_hold',
    question: 'Is your country currently under an administrative hold?',
    options: [
      { label: 'Yes', value: 'yes', result: 'TERMINATED', message: 'Country-wide hold prevents processing.' },
      { label: 'No', value: 'no', result: 'GOOD_FIT' },
    ],
  },
  // Documents Path
  docs_existing_status: {
    id: 'docs_existing_status',
    question: 'Do you currently hold a valid U.S. visa, Green Card, or legal status that needs renewal or adjustment?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'docs_expired' },
      { label: 'No', value: 'no', nextStep: 'docs_first_gc' },
    ],
  },
  docs_expired: {
    id: 'docs_expired',
    question: 'Is your current status still valid, or did it expire less than 6 months ago?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'docs_removal' },
      { label: 'No', value: 'no', result: 'RECOMMENDED_WIZARD', message: 'Lapsed status for more than 6 months usually requires specialized legal intervention. We strongly recommend completing our full assessment wizard to determine your best legal path.' },
    ],
  },
  docs_removal: {
    id: 'docs_removal',
    question: 'Are you currently in removal (deportation) proceedings?',
    options: [
      { label: 'Yes', value: 'yes', result: 'RECOMMENDED_WIZARD', message: 'Being in removal proceedings is a complex legal situation. We recommend our full attorney-guided assessment, but you may still browse our documents if you are confident.' },
      { label: 'No', value: 'no', result: 'DOCUMENTS' },
    ],
  },
  docs_first_gc: {
    id: 'docs_first_gc',
    question: 'Are you seeking to apply for your first Green Card?',
    options: [
      { label: 'Yes, from inside the U.S. (Adjustment of Status)', value: 'inside', nextStep: 'docs_lawful_entry' },
      { label: 'Yes, from abroad (Consular Processing / Self-Petition)', value: 'abroad', result: 'DOCUMENTS' },
    ],
  },
  docs_lawful_entry: {
    id: 'docs_lawful_entry',
    question: 'Did you enter the U.S. lawfully with inspection?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'docs_underlying_petition' },
      { label: 'No', value: 'no', result: 'RECOMMENDED_WIZARD', message: 'Unlawful entry can create significant bars to adjusting status. We recommend our full eligibility assessment before you proceed with individual forms.' },
    ],
  },
  docs_underlying_petition: {
    id: 'docs_underlying_petition',
    question: 'Do you have an underlying approved petition or immediate relative sponsor?',
    options: [
      { label: 'Yes', value: 'yes', result: 'DOCUMENTS' },
      { label: 'No', value: 'no', result: 'RECOMMENDED_WIZARD', message: 'A qualifying petition is usually required for Adjustment of Status. We recommend checking your general eligibility first.' },
    ],
  },
  // Humanitarian Path
  humanitarian_type: {
    id: 'humanitarian_type',
    question: 'Are you seeking protection from persecution or assisting with a foreign adoption?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'humanitarian_location' },
      { label: 'No', value: 'no', nextStep: 'humanitarian_tps' },
    ],
  },
  humanitarian_location: {
    id: 'humanitarian_location',
    question: '(If Asylum/Refugee) Are you currently outside your home country or at a U.S. border?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'humanitarian_grounds' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'You must be outside your home country to seek protection.' },
    ],
  },
  humanitarian_grounds: {
    id: 'humanitarian_grounds',
    question: 'Is the persecution based on Race, Religion, Nationality, Political Opinion, or Social Group?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'humanitarian_deadline' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'General poverty/hardship is not a humanitarian basis.' },
    ],
  },
  humanitarian_deadline: {
    id: 'humanitarian_deadline',
    question: 'Have you been in the U.S. for less than one year (if already inside)?',
    options: [
      { label: 'Yes', value: 'yes', result: 'GOOD_FIT' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'One-year filing deadline missed.' },
    ],
  },
  humanitarian_tps: {
    id: 'humanitarian_tps',
    question: 'Are you seeking TPS (Temporary Protected Status) or a U-Visa (Victim of Crime)?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'humanitarian_tps_country' },
      { label: 'No', value: 'no', result: 'TERMINATED' },
    ],
  },
  humanitarian_tps_country: {
    id: 'humanitarian_tps_country',
    question: 'Is your country of citizenship currently designated for TPS?',
    options: [
      { label: 'Yes', value: 'yes', nextStep: 'humanitarian_tps_residence' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'Your country is not currently designated for TPS.' },
    ],
  },
  humanitarian_tps_residence: {
    id: 'humanitarian_tps_residence',
    question: 'Can you provide proof of continuous residence in the U.S.?',
    options: [
      { label: 'Yes', value: 'yes', result: 'GOOD_FIT' },
      { label: 'No', value: 'no', result: 'TERMINATED', message: 'Continuous residence is required for TPS.' },
    ],
  },
};

const ServiceFitPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  
  const [currentStepId, setCurrentStepId] = useState<string>('start');
  const [history, setHistory] = useState<string[]>([]);
  const [resultMessage, setResultOptions] = useState<{message: string, result: 'GOOD_FIT' | 'TERMINATED' | 'DOCUMENTS' | 'RECOMMENDED_WIZARD'} | null>(null);

  const currentStep = SERVICE_FIT_TREE[currentStepId];

  const handleOptionClick = (option: Option) => {
    if (option.result) {
      setResultOptions({
        result: option.result,
        message: option.message || (option.result === 'TERMINATED' ? 'Based on your answers, you may not be eligible for our automated services at this time.' : '')
      });
      return;
    }

    if (option.nextStep) {
      setHistory([...history, currentStepId]);
      setCurrentStepId(option.nextStep);
    }
  };

  const handleBack = () => {
    const previous = history.pop();
    if (previous) {
      setCurrentStepId(previous);
      setHistory([...history]);
      setResultOptions(null);
    } else {
      navigate('/');
    }
  };

  const renderResult = () => {
    if (!resultMessage) return null;

    switch (resultMessage.result) {
      case 'GOOD_FIT':
        return (
          <div className="text-center space-y-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">You're a Great Fit!</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Based on your initial assessment, we believe Law4Hire can assist you with your immigration goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button onClick={() => navigate('/register')} size="lg" className="px-12">
                Create Account
              </Button>
              <Button onClick={() => navigate('/interview')} variant="secondary" size="lg" className="px-12">
                Start Full Interview
              </Button>
            </div>
          </div>
        );
      case 'DOCUMENTS':
        return (
          <div className="text-center space-y-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Document Preparation</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              You've indicated you are looking for specific document assistance. Explore our catalog of 100+ USCIS forms.
            </p>
            <div className="pt-8">
              <Button onClick={() => navigate('/uscis-documents')} size="lg" className="px-12">
                View Documents Catalog
              </Button>
            </div>
          </div>
        );
      case 'RECOMMENDED_WIZARD':
        return (
          <div className="text-center space-y-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recommendation</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              {resultMessage.message}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button onClick={() => navigate('/interview')} size="lg" className="px-12">
                Start Full Assessment
              </Button>
              <Button onClick={() => navigate('/uscis-documents')} variant="secondary" size="lg" className="px-12">
                Proceed to Documents Anyway
              </Button>
            </div>
          </div>
        );
      case 'TERMINATED':
        return (
          <div className="text-center space-y-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">We're Sorry</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              {resultMessage.message}
            </p>
            <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto italic">
              Our automated system currently handles standard cases. For complex legal issues, we recommend consulting with an immigration attorney directly.
            </p>
            <div className="pt-8">
              <Button onClick={() => navigate('/')} variant="secondary" size="lg">
                Back to Home
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 shadow-xl">
          {resultMessage ? renderResult() : (
            <div className="space-y-8">
              <div className="space-y-4">
                <button 
                  onClick={handleBack}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {currentStep.question}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentStep.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option)}
                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-left hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800/50 transition-all group"
                  >
                    <span className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
        
        {!resultMessage && (
          <div className="text-center mt-12">
            <div className="inline-flex space-x-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 w-12 rounded-full ${i <= history.length ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">Step {history.length + 1} of 5</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceFitPage;
