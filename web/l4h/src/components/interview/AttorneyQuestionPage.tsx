import React from 'react';
import { Button } from '@l4h/shared-ui';
import { RefreshCw, UserPlus, Calendar, CheckCircle } from 'lucide-react';

interface VisaEvaluation {
  visaName: string;
  visaCode: string;
  status: string;
  matchScore: number;
  explanation: string;
  keyBenefits?: string[];
}

interface AttorneyQuestionPageProps {
  question: {
    text: string;
    pageConfig?: string;
  };
  sessionToken: string;
  visaEvaluations: VisaEvaluation[];
  onRetakeInterview: () => void;
  onRegister: () => void;
  onScheduleMeeting: () => void;
}

export const AttorneyQuestionPage: React.FC<AttorneyQuestionPageProps> = ({
  question,
  visaEvaluations,
  onRetakeInterview,
  onRegister,
  onScheduleMeeting
}) => {
  const config = React.useMemo(() => {
    if (question.pageConfig) {
      try {
        return JSON.parse(question.pageConfig);
      } catch {
        console.error('Failed to parse pageConfig');
      }
    }
    return {
      summaryText: 'Based on your responses, here are your visa options:',
      ctaText: 'Ready to get started? Register your account or schedule a consultation.'
    };
  }, [question.pageConfig]);

  const eligibleVisas = visaEvaluations.filter(v => v.status === 'Eligible');
  const potentialVisas = visaEvaluations.filter(v => v.status === 'Potential');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {question.text}
        </h1>
        <p className="text-xl text-gray-600">
          {config.summaryText}
        </p>
      </div>

      {/* Visa Results */}
      <div className="space-y-6">
        {eligibleVisas.length > 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
              <CheckCircle className="mr-2" size={28} />
              You Qualify For:
            </h2>
            <div className="space-y-4">
              {eligibleVisas.map(visa => (
                <div key={visa.visaCode} className="bg-white rounded-lg p-4 shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {visa.visaName}
                    </h3>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {visa.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{visa.explanation}</p>
                  {visa.keyBenefits && visa.keyBenefits.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm text-gray-600 mb-1">
                        Key Benefits:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {visa.keyBenefits.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {potentialVisas.length > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Potential Options:
            </h2>
            <div className="space-y-4">
              {potentialVisas.map(visa => (
                <div key={visa.visaCode} className="bg-white rounded-lg p-4 shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {visa.visaName}
                    </h3>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {visa.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-gray-700">{visa.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {eligibleVisas.length === 0 && potentialVisas.length === 0 && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
            <p className="text-lg text-gray-700">
              We're analyzing your responses to find the best visa options for you.
              Please register or schedule a consultation to discuss your personalized immigration strategy.
            </p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
        <p className="text-lg text-gray-700 mb-6 text-center">
          {config.ctaText}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={onRetakeInterview}
            className="flex items-center justify-center"
          >
            <RefreshCw size={20} className="mr-2" />
            Retake Interview
          </Button>

          <Button
            variant="primary"
            onClick={onRegister}
            size="lg"
            className="flex items-center justify-center"
          >
            <UserPlus size={20} className="mr-2" />
            Register Account
          </Button>

          <Button
            variant="secondary"
            onClick={onScheduleMeeting}
            className="flex items-center justify-center"
          >
            <Calendar size={20} className="mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>
    </div>
  );
};
