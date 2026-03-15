import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, useToast, Spinner, Input } from '@l4h/shared-ui';
import { apiClient } from '../apiClient';

interface FormField {
  id: string;
  pdfFieldId: string;
  fieldType: string;
  defaultValue?: string;
  foxlinDataKey?: string;
}

const DocumentInterviewPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [fields, setFields] = useState<FormField[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFields = async () => {
      if (!formId) return;
      try {
        const data = await apiClient.getDocumentInterviewFields(formId);
        setFields(data);
        // Initialize answers with default values
        const initialAnswers: Record<string, string> = {};
        data.forEach((f: FormField) => {
          initialAnswers[f.pdfFieldId] = f.defaultValue || '';
        });
        setAnswers(initialAnswers);
      } catch (err) {
        error('Error', 'Failed to load form requirements');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [formId]);

  const handleInputChange = (pdfFieldId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [pdfFieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) return;
    setSubmitting(true);
    try {
      const blob = await apiClient.assembleDocument(formId, answers);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `completed_form_${formId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Success', 'Document generated and downloaded!');
    } catch (err) {
      error('Error', 'Failed to generate document');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Smart Form Completion</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <Card title="Required Information">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500 mb-6">
            Please fill out the missing information below to complete your USCIS form. 
            Once finished, you can download the print-ready PDF.
          </p>
          
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.id} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {field.pdfFieldId} {field.foxlinDataKey ? `(${field.foxlinDataKey})` : ''}
                </label>
                <Input
                  value={answers[field.pdfFieldId]}
                  onChange={(e) => handleInputChange(field.pdfFieldId, e.target.value)}
                  placeholder={`Enter ${field.pdfFieldId}...`}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Generating PDF...' : 'Download Completed PDF'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DocumentInterviewPage;
