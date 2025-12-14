import { useState, useEffect, createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Wallet, Clock, Bell, Settings } from 'lucide-react'; // <--- 1. IMPORT ICONS HERE
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FinanceDashboard } from '@/components/dashboards/FinanceDashboard';
import { NotificationsView } from '@/components/views/NotificationsView';
import { SettingsView } from '@/components/views/SettingsView';
import { PastApprovalsView } from '@/components/views/PastApprovalsView'; 
import { listenFinanceMemos, Memo } from '@/lib/memos';

// --- CONTEXT ---
type MemosCtx = { memos: Memo[]; loading: boolean };
const FinanceMemosContext = createContext<MemosCtx>({ memos: [], loading: true });
export const useFinanceMemos = () => useContext(FinanceMemosContext);

function FinanceContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  // LISTEN FOR MEMOS
  useEffect(() => {
    const unsub = listenFinanceMemos((list) => {
      setMemos(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <FinanceDashboard />;
      case 'history': return <PastApprovalsView />;
      case 'notifications': return <NotificationsView />;
      case 'settings': return <SettingsView />;
      default: return <FinanceDashboard />;
    }
  };

  return (
    <FinanceMemosContext.Provider value={{ memos, loading }}>
      <DashboardLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        // --- 2. PASS ACTUAL ICON COMPONENTS (NOT STRINGS) ---
        sidebarItems={[
           { id: 'dashboard', label: 'Overview', icon: Wallet },
           { id: 'history', label: 'Past Approvals', icon: Clock },
           { id: 'notifications', label: 'Notifications', icon: Bell },
           { id: 'settings', label: 'Settings', icon: Settings }
        ]}
      >
        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
      </DashboardLayout>
    </FinanceMemosContext.Provider>
  );
}

export default FinanceContent;