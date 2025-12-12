import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RequesterDashboard } from '@/components/dashboards/RequesterDashboard';
import { NotificationsView } from '@/components/views/NotificationsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NewRequestModal } from '@/components/modals/NewRequestModal';

function RequesterContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <RequesterDashboard onNewRequest={() => setIsNewRequestModalOpen(true)} />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <RequesterDashboard onNewRequest={() => setIsNewRequestModalOpen(true)} />;
    }
  };

  return (
    <>
      <DashboardLayout
        onNewRequest={() => setIsNewRequestModalOpen(true)}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
      >
        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
      </DashboardLayout>

      <NewRequestModal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
      />
    </>
  );
}

export default function RequesterPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'requester') {
    const roleRoutes: Record<string, string> = {
      procurement: '/procurement',
      audit: '/audit',
      finance: '/finance',
    };
    return <Navigate to={roleRoutes[user?.role || 'requester'] || '/login'} replace />;
  }

  return (
    <AppProvider>
      <RequesterContent />
    </AppProvider>
  );
}
