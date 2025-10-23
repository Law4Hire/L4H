import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getMonitoringService } from '../services/TranslationMonitoringService';
import { UserFeedback } from '../types/monitoring';

interface TranslationFeedbackWidgetProps {
  namespace?: string;
  translationKey?: string;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showOnHover?: boolean;
}

export const TranslationFeedbackWidget: React.FC<TranslationFeedbackWidgetProps> = ({
  namespace,
  translationKey,
  className = '',
  position = 'bottom-right',
  showOnHover = true,
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    type: 'translation_quality' as const,
    rating: 0,
    comment: '',
  });

  const monitoringService = getMonitoringService();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monitoringService || feedbackData.rating === 0) return;

    setIsSubmitting(true);

    try {
      const feedback: Omit<UserFeedback, 'id' | 'timestamp'> = {
        type: feedbackData.type,
        language: i18n.language,
        namespace,
        key: translationKey,
        rating: feedbackData.rating,
        comment: feedbackData.comment.trim() || undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
        metadata: {
          currentLanguage: i18n.language,
          availableLanguages: i18n.languages,
          namespace,
          key: translationKey,
        },
      };

      monitoringService.trackUserFeedback(feedback);
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFeedbackData({ type: 'translation_quality', rating: 0, comment: '' });
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackData, i18n.language, i18n.languages, monitoringService, namespace, translationKey]);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  if (!monitoringService) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg
          transition-all duration-200 transform hover:scale-105
          ${showOnHover ? 'opacity-20 hover:opacity-100' : 'opacity-100'}
        `}
        title={t('feedback.widget.title', 'Provide translation feedback')}
        aria-label={t('feedback.widget.aria_label', 'Open translation feedback form')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.4-.32l-4.6 1.92v-4.8A8 8 0 1121 12z" />
        </svg>
      </button>

      {/* Feedback Form */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-green-600 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700 font-medium">
                {t('feedback.widget.success', 'Thank you for your feedback!')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('feedback.widget.title', 'Translation Feedback')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('feedback.widget.description', 'Help us improve translations')}
                </p>
              </div>

              {/* Feedback Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('feedback.widget.type_label', 'Feedback Type')}
                </label>
                <select
                  value={feedbackData.type}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="translation_quality">
                    {t('feedback.widget.type.quality', 'Translation Quality')}
                  </option>
                  <option value="missing_translation">
                    {t('feedback.widget.type.missing', 'Missing Translation')}
                  </option>
                  <option value="cultural_issue">
                    {t('feedback.widget.type.cultural', 'Cultural Issue')}
                  </option>
                  <option value="technical_issue">
                    {t('feedback.widget.type.technical', 'Technical Issue')}
                  </option>
                </select>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('feedback.widget.rating_label', 'Rating')}
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                      className={`p-1 ${
                        star <= feedbackData.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('feedback.widget.comment_label', 'Comment (optional)')}
                </label>
                <textarea
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder={t('feedback.widget.comment_placeholder', 'Tell us more about your experience...')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Context Info */}
              {(namespace || translationKey) && (
                <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <div>Language: {i18n.language}</div>
                  {namespace && <div>Namespace: {namespace}</div>}
                  {translationKey && <div>Key: {translationKey}</div>}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                  disabled={isSubmitting}
                >
                  {t('feedback.widget.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={feedbackData.rating === 0 || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? t('feedback.widget.submitting', 'Submitting...')
                    : t('feedback.widget.submit', 'Submit')
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslationFeedbackWidget;