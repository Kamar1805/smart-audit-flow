import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Helpful runtime validation to avoid cryptic SDK errors
function assertFirebaseEnv(cfg: Record<string, unknown>) {
  const missing = Object.entries(cfg)
    .filter(([_, v]) => !v || (typeof v === 'string' && (v as string).trim() === ''))
    .map(([k]) => k);
  if (missing.length) {
    const msg = `Firebase config missing: ${missing.join(', ')}. Ensure .env contains VITE_FIREBASE_* and restart dev server.`;
    // Throwing makes the error visible early; adjust to console.error if preferred
    throw new Error(msg);
  }
}

assertFirebaseEnv(firebaseConfig as any);

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
