import { useState, useEffect, createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProcurementDashboard } from '@/components/dashboards/ProcurementDashboard';
import { NotificationsView } from '@/components/views/NotificationsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NewRequestModal } from '@/components/modals/NewRequestModal';
import { listenProcurementMemos, Memo } from '@/lib/memos';

// --- 1. DEFINE CONTEXT & EXPORT HOOK (MUST BE AT TOP) ---
type MemosCtx = { memos: Memo[]; loading: boolean };
const ProcurementMemosContext = createContext<MemosCtx>({ memos: [], loading: true });

export const useProcurementMemos = () => useContext(ProcurementMemosContext);
// ---------------------------------------------------------

function ProcurementContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const { logout } = useAuth(); // We don't need 'user' here anymore

  // Firestore memos state
  const [memos, setMemos] = useState<Memo[]>([]);
  const [memosLoading, setMemosLoading] = useState(true);

  useEffect(() => {
    const unsub = listenProcurementMemos((list) => {
      setMemos(list);
      setMemosLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ProcurementDashboard />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ProcurementDashboard />;
    }
  };

  return (
    <ProcurementMemosContext.Provider value={{ memos, loading: memosLoading }}>
      <DashboardLayout
        onNewRequest={() => setIsNewRequestModalOpen(true)}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
        showNewRequest={true}
      >
        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
      </DashboardLayout>

      <NewRequestModal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
      />
    </ProcurementMemosContext.Provider>
  );
}

export default function ProcurementPage() {
  return (
    <AppProvider>
      <ProcurementContent />
    </AppProvider>
  );
}