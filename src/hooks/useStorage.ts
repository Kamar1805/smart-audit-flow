import { useState } from 'react';

export function useStorage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      setUploading(true);
      setError(null);
      // TODO: integrate Google Generative AI / storage service
      await new Promise((res) => setTimeout(res, 800));
      const fakeUrl = `storage://${path}/${file.name}`;
      return fakeUrl;
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error };
}
