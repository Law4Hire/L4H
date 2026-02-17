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
  const { addToast } = useToast();

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAttorneyPhotos(attorneyId);
      setPhotos(data);
      const primary = data.find((p: AttorneyImage) => p.isPrimary);
      if (primary) setSelectedPhotoId(primary.id);
    } catch (err) {
      addToast('Error', 'Failed to load photos', 'error');
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
      addToast('Success', 'Photo uploaded', 'success');
      fetchPhotos();
      if (onPhotoChanged) onPhotoChanged();
    } catch (err) {
      addToast('Error', 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async () => {
    if (!selectedPhotoId) return;
    try {
      await apiClient.setPrimaryPhoto(attorneyId, selectedPhotoId);
      addToast('Success', 'Primary photo updated', 'success');
      fetchPhotos();
      if (onPhotoChanged) onPhotoChanged();
    } catch (err) {
      addToast('Error', 'Failed to set primary photo', 'error');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await apiClient.deleteAttorneyPhoto(attorneyId, photoId);
      addToast('Success', 'Photo deleted', 'success');
      fetchPhotos();
      if (onPhotoChanged) onPhotoChanged();
    } catch (err) {
      addToast('Error', 'Delete failed', 'error');
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
            <Button 
              as="span" 
              variant="outline" 
              disabled={uploading}
              className="cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Upload Picture'}
            </Button>
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
