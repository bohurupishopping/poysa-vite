import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadProgress } from '@/types/business-proposal';
import { useAuth } from './useAuth';

export const useFileUpload = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);

  const uploadFile = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Update upload progress
    const updateProgress = (progress: number, status: FileUploadProgress['status'], url?: string, error?: string) => {
      setUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { ...upload, progress, status, url, error }
          : upload
      ));
    };

    // Add to uploads list
    setUploads(prev => [...prev, {
      file,
      progress: 0,
      status: 'pending'
    }]);

    try {
      updateProgress(0, 'uploading');

      const { data, error } = await supabase.storage
        .from('business-proposal-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-proposal-documents')
        .getPublicUrl(fileName);

      updateProgress(100, 'completed', publicUrl);
      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateProgress(0, 'error', undefined, errorMessage);
      throw error;
    }
  };

  const uploadMultipleFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFile(file));
    return Promise.all(uploadPromises);
  };

  const clearUploads = () => {
    setUploads([]);
  };

  return {
    uploads,
    uploadFile,
    uploadMultipleFiles,
    clearUploads,
  };
};