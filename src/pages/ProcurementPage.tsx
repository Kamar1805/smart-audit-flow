import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProcurementDashboard } from '@/components/dashboards/ProcurementDashboard';
import { NotificationsView } from '@/components/views/NotificationsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NewRequestModal } from '@/components/modals/NewRequestModal';

function ProcurementContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const { logout } = useAuth();

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

export default function ProcurementPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'procurement') {
    const roleRoutes: Record<string, string> = {
      requester: '/requester',
      audit: '/audit',
      finance: '/finance',
    };
    return <Navigate to={roleRoutes[user?.role || 'requester'] || '/login'} replace />;
  }

  return (
    <AppProvider>
      <ProcurementContent />
    </AppProvider>
  );
}
