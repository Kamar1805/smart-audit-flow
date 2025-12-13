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
        showNewRequest={true}
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
  // FIX 1: Get 'profile' and 'loading' from context
  const { isAuthenticated, profile, loading } = useAuth();

  // FIX 2: Handle loading state first to prevent premature redirects
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // FIX 3: Check 'profile.role', NOT 'user.role'
  if (profile?.role !== 'requester') {
    const roleRoutes: Record<string, string> = {
      procurement: '/procurement',
      audit: '/audit',
      finance: '/finance',
    };
    // Redirect based on the actual profile role
    return <Navigate to={roleRoutes[profile?.role || ''] || '/login'} replace />;
  }

  return (
    <AppProvider>
      <RequesterContent />
    </AppProvider>
  );
}