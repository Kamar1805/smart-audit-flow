import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db, ts } from './firebase';

export type Memo = {
  id?: string;
  title: string;
  body: string;
  amount?: number;
  currency?: string;
  vendor?: string;
  // Store the PDF file name if uploaded
  attachments?: Array<{ name: string; url?: string }>;
  requesterId: string;
  requesterName?: string;
  department?: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  route: 'procurement' | 'audit' | 'finance';
  createdAt?: any;
  // NEW: Store the AI Price Check result here
  aiAnalysis?: {
    status: 'fair' | 'high' | 'low' | 'unknown';
    confidence: number;
    reasoning: string;
    estimatedMarketPrice?: string;
  };
};

export async function createMemo(data: Omit<Memo, 'status' | 'route' | 'createdAt'>) {
  const docData: Memo = {
    ...data,
    status: 'pending',
    route: 'procurement', // Default to procurement
    createdAt: ts(),
  };
  const ref = await addDoc(collection(db, 'memos'), docData as any);
  return ref.id;
}

// Function to update the memo with AI analysis results
export async function updateMemoAnalysis(id: string, analysis: Memo['aiAnalysis']) {
  const ref = doc(db, 'memos', id);
  await updateDoc(ref, { aiAnalysis: analysis });
}

export function listenProcurementMemos(cb: (list: Memo[]) => void) {
  const q = query(
    collection(db, 'memos'),
    where('route', '==', 'procurement'), // Only show items sent to procurement
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const items: Memo[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Memo) }));
    cb(items);
  });
}