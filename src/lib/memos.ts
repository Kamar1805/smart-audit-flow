import { 
  addDoc, 
  collection, 
  doc, 
  getDoc,
  onSnapshot, 
  orderBy, 
  query, 
  updateDoc, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { serverTimestamp } from 'firebase/firestore';

export type Memo = {
  id?: string;
  title: string;
  body: string;
  
  // Amounts
  amount?: number;       // Original requested amount
  price?: number;        // Alias often used in UI
  paidAmount?: number;   // Actual amount paid by Finance
  currency?: string;
  
  vendor?: string;
  attachments?: Array<{ name: string; url?: string }>;
  requesterId: string;
  requesterName?: string;
  department?: string;
  
  // Status & Routing
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';
  route: 'procurement' | 'audit' | 'finance' | 'completed';
  createdAt?: any;
  updatedAt?: string;
  
  // Timestamps for audit trail
  procurementApprovedAt?: string;
  auditApprovedAt?: string;
  financeApprovedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  paymentDate?: string;

  // --- NEW: EXECUTIVE TRACKING ---
  forwardedBy?: string; // e.g., "GMD", "Chairman" - Visible to Finance
  // -------------------------------

  // --- NEW: PURCHASE VERIFICATION ---
  purchaseConfirmedAt?: string; // When they uploaded the receipt
  purchaseReceiptUrl?: string;  // The proof of purchase
  // ----------------------------------

  // Rejection & Payment Data
  rejectionReason?: string;
  receiptUrl?: string;

  // AI & Audit Data
  aiAnalysis?: {
    status: 'fair' | 'high' | 'low' | 'unknown';
    confidence: number;
    reasoning: string;
    estimatedMarketPrice?: string;
    breakdown?: any[];
  };

  auditAnalysis?: {
    status: 'compliant' | 'violation' | 'warning';
    reasoning?: string;
    riskLevel?: string;
    violations?: string[];
  };
};

// 1. CREATE MEMO
export async function createMemo(data: Omit<Memo, 'status' | 'route' | 'createdAt'>) {
  const docData: Memo = {
    ...data,
    status: 'pending',
    route: 'procurement', // Starts at Procurement
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'memos'), docData as any);
  return ref.id;
}

// 2. LISTENERS (REAL-TIME DATA)

// A. Procurement Inbox
export function listenProcurementMemos(cb: (list: Memo[]) => void) {
  // Listen for active procurement AND any completed items (for history/purchases)
  const q = query(
    collection(db, 'memos'),
    where('route', 'in', ['procurement', 'completed']),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const items: Memo[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Memo) }));
    cb(items);
  });
}

// B. Executive Shared Memos
export type SharedMemo = {
  id?: string;
  memoId: string;
  toUid: string;
  position?: string;
  title: string;
  body: string;
  amount: number;
  currency: string;
  department: string;
  sharedByUid: string;
  sharedByName: string;
  sharedAt: number;
  status: 'pending' | 'approved' | 'forwarded' | 'rejected';
  
  // History Fields
  actionDate?: string;      // When the Exec approved/rejected
  rejectionReason?: string; // Reason if rejected
};

export async function shareMemoToExecutive(memo: Memo, executiveUid: string, position?: string) {
  const col = collection(db, 'sharedMemos');
  await addDoc(col, {
    memoId: memo.id!,
    toUid: executiveUid,
    position: position || null, 
    title: memo.title,
    body: memo.body,
    amount: memo.amount || memo.price || 0,
    currency: memo.currency || 'NGN',
    department: memo.department || 'General',
    sharedByUid: memo.requesterId,
    sharedByName: memo.requesterName || 'Unknown',
    sharedAt: Date.now(),
    status: 'pending',
  } as SharedMemo);
}

export function listenExecutiveSharedMemos(uid: string, cb: (list: SharedMemo[]) => void) {
  const colRef = collection(db, 'sharedMemos');
  const qExec = query(colRef, where('toUid', '==', uid));
  return onSnapshot(qExec, (snap) => {
    const list: SharedMemo[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as SharedMemo) }));
    cb(list);
  });
}

// UPDATED: Approve & Forward (Tags it as coming from Executive)
export async function executiveApproveAndForward(sharedMemoId: string, executivePosition: string) {
  const smRef = doc(db, 'sharedMemos', sharedMemoId);
  
  // 1. Mark Shared Memo as Forwarded locally (for Exec History)
  await updateDoc(smRef, { 
    status: 'forwarded',
    actionDate: new Date().toISOString() 
  });
  
  const snap = await getDoc(smRef);
  const data = snap.data() as SharedMemo;

  if (data?.memoId) {
    const memoRef = doc(db, 'memos', data.memoId);
    
    // 2. Move original Memo to Finance
    // We add 'lastActionBy' so Finance knows it came from the GMD/Chairman
    await updateDoc(memoRef, { 
      route: 'finance', 
      status: 'pending', // Pending Finance's own approval/payment
      auditApprovedAt: new Date().toISOString(), // Treat Exec approval as passing the audit check
      forwardedBy: executivePosition || 'Executive' // <--- VISIBLE TO FINANCE
    });
  }
}

// NEW: Reject Memo (Sends back to history)
export async function executiveRejectMemo(sharedMemoId: string, reason: string) {
  const smRef = doc(db, 'sharedMemos', sharedMemoId);
  
  // 1. Mark Shared Memo as Rejected locally
  await updateDoc(smRef, { 
    status: 'rejected',
    actionDate: new Date().toISOString(),
    rejectionReason: reason
  });

  const snap = await getDoc(smRef);
  const data = snap.data() as SharedMemo;

  if (data?.memoId) {
    const memoRef = doc(db, 'memos', data.memoId);
    
    // 2. Update original Memo status to Rejected
    await updateDoc(memoRef, { 
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'Executive',
      rejectionReason: reason
    });
  }
}

// C. Audit Inbox
export const listenAuditMemos = (callback: (memos: Memo[]) => void) => {
  const q = query(
    collection(db, 'memos'),
    where('route', '==', 'audit'), 
    where('status', '==', 'pending') 
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Memo[];
    callback(items);
  });
};

// D. Finance Inbox
export function listenFinanceMemos(cb: (list: Memo[]) => void) {
  const q = query(
    collection(db, 'memos'),
    where('route', 'in', ['finance', 'completed']), 
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Memo[];
    cb(items);
  }, (error) => {
    console.error("Error listening to finance memos:", error);
  });
}

// 3. UPDATES & ACTIONS

// Update AI Analysis
export async function updateMemoAnalysis(id: string, analysis: Memo['aiAnalysis']) {
  const ref = doc(db, 'memos', id);
  await updateDoc(ref, { aiAnalysis: analysis });
}

// Update Audit Analysis
export const updateMemoAudit = async (id: string, analysisData: any) => {
  try {
    const docRef = doc(db, 'memos', id);
    await updateDoc(docRef, {
      auditAnalysis: analysisData, 
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating audit analysis:", error);
    throw error;
  }
};

// Move Workflow Forward (Approve) or Backward (Reject)
export async function updateMemoAction(
  id: string, 
  action: 'approve' | 'reject' | 'pay', 
  currentRoute: 'procurement' | 'audit' | 'finance',
  data?: { reason?: string; receiptUrl?: string; paidAmount?: number } 
) {
  const memoRef = doc(db, 'memos', id);
  let updates: any = {}; 

  if (action === 'reject') {
    updates = {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: currentRoute,
      rejectionReason: data?.reason || null 
    };
  } else if (action === 'approve') {
    // MOVE TO NEXT STAGE
    if (currentRoute === 'procurement') {
      updates = {
        route: 'audit',       // Move to Audit
        status: 'pending',    // Reset status
        procurementApprovedAt: new Date().toISOString()
      };
    } else if (currentRoute === 'audit') {
      updates = {
        route: 'finance',     // Move to Finance
        status: 'pending',
        auditApprovedAt: new Date().toISOString()
      };
    }
  } else if (action === 'pay' && currentRoute === 'finance') {
    updates = {
      status: 'paid',
      route: 'completed',
      paymentDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(), // Updates sort order
      receiptUrl: data?.receiptUrl || null,
      paidAmount: data?.paidAmount || null // Stores actual paid amount
    };
  }

  await updateDoc(memoRef, updates);
}

// --- NEW FUNCTION: Requester Confirms Purchase ---
export async function confirmItemPurchase(id: string, receiptUrl: string) {
  const memoRef = doc(db, 'memos', id);
  await updateDoc(memoRef, {
    purchaseConfirmedAt: new Date().toISOString(),
    purchaseReceiptUrl: receiptUrl
  });
}

// Add this if you don't have it, or update it
export function listenUserMemos(userId: string, cb: (list: Memo[]) => void) {
  const q = query(
    collection(db, 'memos'),
    where('requesterId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const items: Memo[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Memo) }));
    cb(items);
  });
}