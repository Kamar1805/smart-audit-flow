import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuditDashboard } from '@/components/dashboards/AuditDashboard';
import { NotificationsView } from '@/components/views/NotificationsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NewRequestModal } from '@/components/modals/NewRequestModal';

function AuditContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AuditDashboard />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AuditDashboard />;
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

export default function AuditPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'audit') {
    const roleRoutes: Record<string, string> = {
      requester: '/requester',
      procurement: '/procurement',
      finance: '/finance',
    };
    return <Navigate to={roleRoutes[user?.role || 'requester'] || '/login'} replace />;
  }

  return (
    <AppProvider>
      <AuditContent />
    </AppProvider>
  );
}
