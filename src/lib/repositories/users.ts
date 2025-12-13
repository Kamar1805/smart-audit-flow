import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AppRole = 'requester' | 'procurement' | 'audit' | 'finance';

export type AppUserProfile = {
  uid: string;
  name: string;
  staffId: string;
  email: string;
  role: AppRole;
  department: string;
  createdAt: number;
};

export async function getUserProfile(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as AppUserProfile) : null;
}

export async function setUserProfile(profile: AppUserProfile) {
  const ref = doc(db, 'users', profile.uid);
  await setDoc(ref, profile);
}
