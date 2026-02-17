import React, { useEffect, useState } from 'react';
import { Card, Button, useToast, Spinner } from '@l4h/shared-ui';
import { apiClient } from '../../apiClient';

interface DocumentPoolDoc {
  id: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  status: number;
  isVerified: boolean;
  assignedUserId?: string;
  assignedCaseId?: string;
  uploadedAt: string;
  uploadedBy: string;
  internalNotes?: string;
}

const DocumentPoolPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentPoolDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusStatusFilter] = useState<number>(0); // 0 = Pending
  const { addToast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getDocumentPoolByStatus(statusFilter);
      setDocuments(data);
    } catch (err) {
      addToast('Error', 'Failed to fetch documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const handleVerify = async (id: string, approve: boolean) => {
    try {
      await apiClient.verifyDocument(id, {
        approve,
        staffId: 1, // Placeholder for logged in staff ID
        internalNotes: 'Verified via admin panel'
      });
      addToast('Success', `Document ${approve ? 'verified' : 'rejected'}`, 'success');
      fetchDocuments();
    } catch (err) {
      addToast('Error', 'Failed to verify document', 'error');
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Verified';
      case 2: return 'Rejected';
      case 3: return 'Unassigned';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Document Pool Management</h1>
        <div className="flex space-x-2">
          {[0, 1, 2, 3].map(s => (
            <Button 
              key={s} 
              variant={statusFilter === s ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusStatusFilter(s)}
            >
              {getStatusLabel(s)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">No documents found matching this filter.</p>
            </Card>
          ) : (
            documents.map(doc => (
              <Card key={doc.id} className="flex flex-row justify-between items-center p-4">
                <div>
                  <h3 className="font-semibold">{doc.originalFileName}</h3>
                  <p className="text-sm text-gray-500">
                    Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">ID: {doc.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <a 
                    href={doc.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm px-2"
                  >
                    Preview
                  </a>
                  {doc.status === 0 && (
                    <>
                      <Button variant="success" size="sm" onClick={() => handleVerify(doc.id, true)}>Verify</Button>
                      <Button variant="danger" size="sm" onClick={() => handleVerify(doc.id, false)}>Reject</Button>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentPoolPage;
