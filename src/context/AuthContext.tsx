import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AppUserProfile, getUserProfile, setUserProfile, AppRole } from '@/lib/repositories/users';

interface AuthContextType {
  user: User | null;
  profile: AppUserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: AppUserProfile }>;
  signup: (data: { name: string; staffId: string; email: string; password: string; role: AppRole; department: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        // User is logged in, fetch profile BEFORE stopping loading
        try {
          const p = await getUserProfile(u.uid);
          setProfile(p);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        }
      } else {
        // User is logged out
        setProfile(null);
      }
      
      // Only set loading to false AFTER profile logic is done
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Manually fetch profile here too, to return it immediately to the Login component
      const userProfile = await getUserProfile(cred.user.uid);
      setProfile(userProfile); // Update state immediately
      return { success: true, data: userProfile };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const signup = async (data: { name: string; staffId: string; email: string; password: string; role: AppRole; department: string }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const newProfile: AppUserProfile = {
        uid: cred.user.uid,
        name: data.name,
        staffId: data.staffId,
        email: data.email,
        role: data.role,
        department: data.department,
        createdAt: Date.now(),
      };
      
      await setUserProfile(newProfile);
      setProfile(newProfile); // Update state immediately
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}