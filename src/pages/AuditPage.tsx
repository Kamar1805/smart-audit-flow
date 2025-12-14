import { useState, useEffect, createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuditDashboard } from '@/components/dashboards/AuditDashboard';
import { NotificationsView } from '@/components/views/NotificationsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NewRequestModal } from '@/components/modals/NewRequestModal';
import { listenAuditMemos, Memo } from '@/lib/memos';

// --- CONTEXT ---
type MemosCtx = { memos: Memo[]; loading: boolean };
const AuditMemosContext = createContext<MemosCtx>({ memos: [], loading: true });
export const useAuditMemos = () => useContext(AuditMemosContext);

function AuditContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const { logout } = useAuth();
  
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  // LISTEN FOR MEMOS ASSIGNED TO 'AUDIT'
  useEffect(() => {
    const unsub = listenAuditMemos((list) => {
      setMemos(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <AuditDashboard />;
      case 'notifications': return <NotificationsView />;
      case 'settings': return <SettingsView />;
      default: return <AuditDashboard />;
    }
  };

  return (
    <AuditMemosContext.Provider value={{ memos, loading }}>
      <DashboardLayout
        onNewRequest={() => setIsNewRequestModalOpen(true)}
        onLogout={logout}
        currentView={currentView}
        onViewChange={setCurrentView}
        showNewRequest={false} // Audit doesn't usually create requests
      >
        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
      </DashboardLayout>
      <NewRequestModal isOpen={isNewRequestModalOpen} onClose={() => setIsNewRequestModalOpen(false)} />
    </AuditMemosContext.Provider>
  );
}

export default function AuditPage() {
  return (
    <AppProvider>
      <AuditContent />
    </AppProvider>
  );
}