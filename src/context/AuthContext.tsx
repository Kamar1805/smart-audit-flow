import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from './AppContext';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials for each role
const mockCredentials: Record<string, { password: string; role: UserRole; name: string }> = {
  'requester@saps.com': { password: 'requester123', role: 'requester', name: 'John Smith' },
  'procurement@saps.com': { password: 'procurement123', role: 'procurement', name: 'Emily Davis' },
  'audit@saps.com': { password: 'audit123', role: 'audit', name: 'Michael Chen' },
  'finance@saps.com': { password: 'finance123', role: 'finance', name: 'Sarah Johnson' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    const credentials = mockCredentials[email.toLowerCase()];
    
    if (!credentials) {
      return { success: false, error: 'Invalid email address' };
    }
    
    if (credentials.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    setUser({
      email: email.toLowerCase(),
      role: credentials.role,
      name: credentials.name,
    });

    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
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

export { mockCredentials };
