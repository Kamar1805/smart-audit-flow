import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProcurementRequest, RequestStatus } from '@/context/AppContext';

export async function fetchRequestsByRole(role: string) {
  const col = collection(db, 'requests');
  const q = query(col, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ProcurementRequest[];
}

export async function createRequest(data: Omit<ProcurementRequest, 'id' | 'createdAt'>) {
  const col = collection(db, 'requests');
  const docRef = await addDoc(col, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}
