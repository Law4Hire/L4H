import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, useToast } from '@l4h/shared-ui';
import { DocumentKnockoutWizard } from '../components/DocumentKnockoutWizard';

interface USCISForm {
  id: string;
  formNumber: string;
  formName: string;
  description: string | null;
}

const USCISDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  
  const [forms, setForms] = useState<USCISForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedForm, setSelectedForm] = useState<USCISForm | null>(null);
  const [showKnockout, setShowKnockout] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/public/uscis-forms');
        if (!response.ok) throw new Error('Failed to load forms');
        const data = await response.json();
        setForms(data);
      } catch (err) {
        console.error('Error fetching forms:', err);
        showError('Could not load the documents catalog. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [showError]);

  const filteredForms = forms.filter(form => 
    form.formNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectForm = (form: USCISForm) => {
    setSelectedForm(form);
    setShowKnockout(true);
  };

  const handleEligible = () => {
    if (selectedForm) {
      setShowKnockout(false);
      navigate('/register', { state: { selectedFormId: selectedForm.id, formNumber: selectedForm.formNumber } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">USCIS Documents Catalog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Browse our comprehensive collection of 100+ immigration forms. Select a form to start your automated preparation.
          </p>
        </header>

        <div className="mb-8 max-w-md mx-auto">
          <Input 
            placeholder="Search by form number or name (e.g. I-130)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full shadow-md"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-600">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-lg font-bold px-3 py-1 rounded">
                      {form.formNumber}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                    {form.formName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow">
                    {form.description || 'Automated USCIS form preparation and legal review service.'}
                  </p>
                  <Button onClick={() => handleSelectForm(form)} className="w-full">
                    Start Form
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredForms.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500 dark:text-gray-400">No forms found matching your search.</p>
          </div>
        )}
      </div>

      {showKnockout && selectedForm && (
        <Modal 
          open={showKnockout} 
          onClose={() => setShowKnockout(false)}
          title={`Eligibility Check: ${selectedForm.formNumber}`}
        >
          <DocumentKnockoutWizard 
            formNumber={selectedForm.formNumber}
            formName={selectedForm.formName}
            onEligible={handleEligible}
            onCancel={() => setShowKnockout(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default USCISDocumentsPage;
