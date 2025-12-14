import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Department = {
  name: string;
  budget: number; // total budget
  spent: number;  // cumulative spent
};

export async function listDepartments(): Promise<Department[]> {
  const col = collection(db, 'departments');
  const snap = await getDocs(col);
  const items = snap.docs.map(d => ({ ...(d.data() as any) })) as Department[];
  return items;
}

export async function ensureDepartmentsFromUsers(defaultBudget = 20000000): Promise<void> {
  const usersCol = collection(db, 'users');
  const snap = await getDocs(usersCol);
  const depts = new Set<string>();
  snap.docs.forEach(d => {
    const data = d.data() as any;
    if (data?.department) depts.add(data.department);
  });
  for (const name of depts) {
    const ref = doc(db, 'departments', name);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, { name, budget: defaultBudget, spent: 0 });
    }
  }
}

export async function updateDepartmentSpend(name: string, delta: number): Promise<void> {
  const ref = doc(db, 'departments', name);
  const snap = await getDoc(ref);
  const curr = snap.exists() ? (snap.data() as any) : { name, budget: 20000000, spent: 0 };
  const spent = Math.max(0, (curr.spent || 0) + delta);
  await setDoc(ref, { name, budget: curr.budget || 20000000, spent }, { merge: true });
}
