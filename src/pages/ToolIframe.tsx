import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function ToolContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { logout } = useAuth();
  const loc = useLocation();
  const handleLogout = () => logout();
  const src = loc.pathname.includes('anomaly')
    ? 'https://example.com/anomaly'
    : 'https://example.com/vendors';

  return (
    <DashboardLayout
      onNewRequest={() => {}}
      onLogout={handleLogout}
      currentView={currentView}
      onViewChange={setCurrentView}
      showNewRequest={true}
    >
      <AnimatePresence mode="wait">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl font-semibold text-foreground">AI Tools</h2>
            <span className="h-1 w-16 rounded bg-gradient-to-r from-primary/60 to-primary/10 animate-pulse" />
          </div>
          <iframe title="ai-tools" src={src} className="w-full h-[60vh] rounded border border-border" />
        </div>
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function ToolIframePage() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppProvider>
      <ToolContent />
    </AppProvider>
  );
}
