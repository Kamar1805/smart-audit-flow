import { doc, getDoc, setDoc } from 'firebase/firestore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AppRole = 'requester' | 'procurement' | 'audit' | 'finance' | 'executive';

export type AppUserProfile = {
  uid: string;
  name: string;
  staffId: string;
  email: string;
  role: AppRole;
  department: string;
  createdAt: number;
  phone?: string;
  executiveId?: string; // strictly 'Kamar1805' when role is executive
  position?: 'Executive Director' | 'Group Managing Director' | 'The Chairman';
};

export function validateExecutiveId(id: string) {
  return id.trim().toLowerCase() === 'kamar1805';
}

export async function getUserProfile(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as AppUserProfile) : null;
}

export async function setUserProfile(profile: AppUserProfile) {
  const ref = doc(db, 'users', profile.uid);
  await setDoc(ref, profile);
}

export async function updateUserProfile(uid: string, updates: Partial<AppUserProfile>) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, updates, { merge: true });
}

export async function listUsersWithPhone(excludeRole?: AppRole) {
  const col = collection(db, 'users');
  const q = excludeRole ? query(col, where('role', '!=', excludeRole)) : col;
  const snap = await getDocs(q as any);
  return snap.docs
    .map(d => d.data() as AppUserProfile)
    .filter(u => !!u.phone);
}

export async function listExecutives() {
  const col = collection(db, 'users');
  const q = query(col, where('role', '==', 'executive'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AppUserProfile);
}
