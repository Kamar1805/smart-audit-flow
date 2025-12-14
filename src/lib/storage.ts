import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function uploadMemoPdf(blob: Blob, path: string): Promise<string> {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob, { contentType: 'application/pdf' });
  const url = await getDownloadURL(fileRef);
  return url;
}
