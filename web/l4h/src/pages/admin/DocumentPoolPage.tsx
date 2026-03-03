import React, { useEffect, useState } from 'react';
import { Card, Button, useToast } from '@l4h/shared-ui';

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

const getStatusLabel = (status: number) => {
  switch (status) {
    case 0: return 'Pending';
    case 1: return 'Verified';
    case 2: return 'Rejected';
    case 3: return 'Unassigned';
    default: return 'Unknown';
  }
};

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const DocumentPoolPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentPoolDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const { success, error } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/documentpool/status/${statusFilter}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setDocuments(await res.json());
    } catch (err) {
      error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, [statusFilter]);

  const handleVerify = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/v1/documentpool/${id}/verify`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, internalNotes: 'Verified via admin panel' }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      success(`Document ${approve ? 'verified' : 'rejected'}`);
      fetchDocuments();
    } catch (err) {
      error(`Failed to ${approve ? 'verify' : 'reject'} document`);
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
              onClick={() => setStatusFilter(s)}
            >
              {getStatusLabel(s)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
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
                  <p className="text-xs text-gray-400 mt-1">Status: {getStatusLabel(doc.status)}</p>
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
                      <Button variant="primary" size="sm" onClick={() => handleVerify(doc.id, true)}>Verify</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleVerify(doc.id, false)}>Reject</Button>
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
