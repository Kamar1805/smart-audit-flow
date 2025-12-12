import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from '@/context/AppContext';
import { LandingPage } from '@/components/landing/LandingPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RequesterDashboard } from '@/components/dashboards/RequesterDashboard';
import { ProcurementDashboard } from '@/components/dashboards/ProcurementDashboard';
import { AuditDashboard } from '@/components/dashboards/AuditDashboard';
import { FinanceDashboard } from '@/components/dashboards/FinanceDashboard';
import { NotificationsView } from '@/components/views/NotificationsView';
import { SettingsView } from '@/components/views/SettingsView';
import { NewRequestModal } from '@/components/modals/NewRequestModal';

function AppContent() {
  const [isLaunched, setIsLaunched] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const { currentRole } = useApp();

  const handleLogout = () => {
    setIsLaunched(false);
    setCurrentView('dashboard');
  };

  if (!isLaunched) {
    return <LandingPage onLaunch={() => setIsLaunched(true)} />;
  }

  const renderDashboard = () => {
    switch (currentRole) {
      case 'requester':
        return (
          <RequesterDashboard onNewRequest={() => setIsNewRequestModalOpen(true)} />
        );
      case 'procurement':
        return <ProcurementDashboard />;
      case 'audit':
        return <AuditDashboard />;
      case 'finance':
        return <FinanceDashboard />;
      default:
        return (
          <RequesterDashboard onNewRequest={() => setIsNewRequestModalOpen(true)} />
        );
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return renderDashboard();
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

const Index = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
