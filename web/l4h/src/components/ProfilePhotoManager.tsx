import React, { useEffect, useState } from 'react';
import { Card, Button, useToast, Spinner } from '@l4h/shared-ui';
import { apiClient } from '../apiClient';

interface AttorneyImage {
  id: string;
  fileUrl: string;
  fileName: string;
  isPrimary: boolean;
  createdAt: string;
}

interface ProfilePhotoManagerProps {
  attorneyId: number;
  onPhotoChanged?: () => void;
}

const ProfilePhotoManager: React.FC<ProfilePhotoManagerProps> = ({ attorneyId, onPhotoChanged }) => {
  const [photos, setPhotos] = useState<AttorneyImage[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { success, error } = useToast();

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAttorneyPhotos(attorneyId);
      setPhotos(data);
      const primary = data.find((p: AttorneyImage) => p.isPrimary);
      if (primary) setSelectedPhotoId(primary.id);
    } catch (err) {
      error('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [attorneyId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      await apiClient.uploadAttorneyPhoto(attorneyId, e.target.files[0]);
      success('Success', 'Photo uploaded');
      fetchPhotos();
      if (onPhotoChanged) onPhotoChanged();
    } catch (err) {
      error('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async () => {
    if (!selectedPhotoId) return;
    try {
      await apiClient.setPrimaryPhoto(attorneyId, selectedPhotoId);
      success('Success', 'Primary photo updated');
      fetchPhotos();
      if (onPhotoChanged) onPhotoChanged();
    } catch (err) {
      error('Error', 'Failed to set primary photo');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await apiClient.deleteAttorneyPhoto(attorneyId, photoId);
      success('Success', 'Photo deleted');
      fetchPhotos();
      if (onPhotoChanged) onPhotoChanged();
    } catch (err) {
      error('Error', 'Delete failed');
    }
  };

  if (loading) return <Spinner size="md" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {photos.map(photo => (
          <div 
            key={photo.id} 
            className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedPhotoId === photo.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
            onClick={() => setSelectedPhotoId(photo.id)}
          >
            <img 
              src={photo.fileUrl} 
              alt={photo.fileName} 
              className="w-full h-24 object-cover"
            />
            {photo.isPrimary && (
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-bl-md font-bold uppercase">
                Primary
              </span>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
              className="absolute bottom-0 right-0 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="file"
            id="photo-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <label htmlFor="photo-upload">
            <span className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              {uploading ? 'Uploading...' : 'Upload Picture'}
            </span>
          </label>

          <Button
            variant="primary"
            disabled={!selectedPhotoId || photos.find(p => p.id === selectedPhotoId)?.isPrimary}
            onClick={handleSetPrimary}
          >
            Choose Picture
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 italic">
          * Choose Picture is disabled unless a non-primary image is selected.
        </p>
      </div>
    </div>
  );
};

export default ProfilePhotoManager;
