
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

interface NextStepsProps {
  visaTypeCode: string;
  countryCode: string;
}

interface WorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
}

const NextSteps: React.FC<NextStepsProps> = ({ visaTypeCode, countryCode }) => {
  const { t } = useTranslation();

  const { data: steps = [], isLoading, error } = useQuery<WorkflowStep[]>({
    queryKey: ['workflow', visaTypeCode, countryCode],
    queryFn: async () => {
      const response = await fetch(`/api/v1/workflows?visaType=${visaTypeCode}&country=${countryCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch next steps');
      }
      return response.json();
    },
    enabled: !!visaTypeCode && !!countryCode,
  });

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="text-red-600">{t('common.error')}</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('dashboard.nextSteps')}</h3>
      <ul className="mt-2 space-y-2">
        {steps.map((step) => (
          <li key={step.stepNumber} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="font-semibold">{step.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NextSteps;
