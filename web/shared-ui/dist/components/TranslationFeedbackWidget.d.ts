import React from 'react';
interface TranslationFeedbackWidgetProps {
    namespace?: string;
    translationKey?: string;
    className?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    showOnHover?: boolean;
}
export declare const TranslationFeedbackWidget: React.FC<TranslationFeedbackWidgetProps>;
export default TranslationFeedbackWidget;
