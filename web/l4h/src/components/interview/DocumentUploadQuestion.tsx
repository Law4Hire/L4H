import React, { useState, useMemo } from 'react';
import { Button, useToast } from '@l4h/shared-ui';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

interface DocumentUploadConfig {
  instructionText: string;
  allowedFileTypes: string[];
  maxFiles: number;
  minFiles: number;
  isRequired: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'complete' | 'error';
  progress: number;
}

interface DocumentUploadQuestionProps {
  question: {
    text: string;
    pageConfig?: string;
    key: string;
  };
  sessionToken: string;
  onComplete: (files: UploadedFile[]) => void;
}

export const DocumentUploadQuestion: React.FC<DocumentUploadQuestionProps> = ({
  question,
  sessionToken,
  onComplete
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const config = useMemo<DocumentUploadConfig>(() => {
    if (question.pageConfig) {
      try {
        return JSON.parse(question.pageConfig);
      } catch {
        console.error('Failed to parse pageConfig');
      }
    }
    return {
      instructionText: 'Please upload your documents',
      allowedFileTypes: ['pdf', 'jpg', 'png'],
      maxFiles: 5,
      minFiles: 1,
      isRequired: true
    };
  }, [question.pageConfig]);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !config.allowedFileTypes.includes(ext)) {
      return `File type .${ext} not allowed. Allowed: ${config.allowedFileTypes.join(', ')}`;
    }

    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return 'File size exceeds 25MB limit';
    }

    if (uploadedFiles.length >= config.maxFiles) {
      return `Maximum ${config.maxFiles} files allowed`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const uploadId = crypto.randomUUID();
    const newFile: UploadedFile = {
      id: uploadId,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    };

    setUploadedFiles(prev => [...prev, newFile]);

    try {
      // Step 1: Get presigned URL
      const presignResponse = await fetch('/api/interview/documents/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          questionId: question.key,
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size
        })
      });

      if (!presignResponse.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, uploadId: serverUploadId } = await presignResponse.json();

      // Step 2: Upload file to upload gateway
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      // Step 3: Confirm upload
      await fetch('/api/interview/documents/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          uploadId: serverUploadId,
          storagePath: uploadResponse.headers.get('X-Storage-Path') || ''
        })
      });

      // Update status to complete
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadId ? { ...f, status: 'complete', progress: 100 } : f
      ));

      showSuccess(`${file.name} uploaded successfully`);
    } catch (error) {
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadId ? { ...f, status: 'error' } : f
      ));
      showError(`Failed to upload ${file.name}`);
    }
  };

  const handleFileSelect = (files: FileList) => {
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        showError(error);
        return;
      }
      uploadFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDelete = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Call backend to delete the file
      // For now, just remove from local state
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      showSuccess('File removed');
    } catch (error) {
      showError('Failed to remove file');
    }
  };

  const canContinue = () => {
    const completeFiles = uploadedFiles.filter(f => f.status === 'complete');
    return completeFiles.length >= config.minFiles;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{question.text}</h2>

      {config.instructionText && (
        <p className="text-lg text-gray-600 dark:text-gray-300">{config.instructionText}</p>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50 dark:border-gold-500 dark:bg-gold-900/20' : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <Upload className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size={48} />
        <p className="text-lg font-semibold mb-2 dark:text-white">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Accepted: {config.allowedFileTypes.map(t => `.${t}`).join(', ')}
        </p>
        <input
          type="file"
          multiple
          accept={config.allowedFileTypes.map(t => `.${t}`).join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <span className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm px-4 py-2 text-base">
            Choose Files
          </span>
        </label>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold dark:text-white">Uploaded Files:</h3>
          {uploadedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700"
            >
              <div className="flex items-center space-x-3 flex-1">
                <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                <div className="flex-1">
                  <p className="font-medium dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {file.status === 'uploading' && (
                <div className="text-blue-600 dark:text-blue-400">Uploading...</div>
              )}
              {file.status === 'complete' && (
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              )}
              {file.status === 'error' && (
                <span className="text-red-600 dark:text-red-400">Failed</span>
              )}

              <button
                onClick={() => handleDelete(file.id)}
                className="ml-3 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => onComplete(uploadedFiles)}
          disabled={!canContinue()}
          size="lg"
        >
          Continue
        </Button>
      </div>

      {!canContinue() && config.isRequired && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-right">
          Please upload at least {config.minFiles} file(s) to continue
        </p>
      )}
    </div>
  );
};
