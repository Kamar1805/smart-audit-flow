import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bell,
  FilePlus,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  History
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Footer from '@/components/layout/Footer';

// --- 1. UPDATE INTERFACE ---
interface DashboardLayoutProps {
  children: React.ReactNode;
  onNewRequest?: () => void; // Made optional as Finance doesn't always need it
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  showNewRequest?: boolean;
  // New Prop: Allow custom sidebar items
  sidebarItems?: Array<{ id: string; label: string; icon: any }>; 
}

const roleLabels: Record<string, string> = {
  requester: 'Head of Department',
  procurement: 'Procurement Officer',
  audit: 'Internal Audit',
  finance: 'Finance Approver',
};

// Default items (fallback)
const defaultNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'new-request', label: 'New Request', icon: FilePlus },
  { id: 'past-requests', label: 'Past Requests', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({
  children,
  onNewRequest = () => {}, // Default empty function
  onLogout,
  currentView,
  onViewChange,
  showNewRequest = false,
  sidebarItems, // --- 2. DESTRUCTURE PROP ---
}: DashboardLayoutProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  // --- 3. DETERMINE WHICH ITEMS TO SHOW ---
  // If sidebarItems is provided (like in Finance Page), use it.
  // Otherwise, use the default logic.
  const itemsToRender = sidebarItems || defaultNavItems.filter(item => 
    item.id !== 'new-request' || showNewRequest
  );

  const handleNavClick = (id: string) => {
    if (id === 'new-request') {
      onNewRequest();
    } else if (id === 'past-requests') {
      navigate('/requests-history');
    } else {
      onViewChange(id);
    }
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo Section */}
      <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <img src="/saps.png" alt="SAPS Logo" className="h-12 w-auto object-contain" />
          <span className="font-display text-2xl font-bold text-gray-900 tracking-tight">SAPS</span>
        </div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">
          Smart Auditing System
        </p>
    </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {itemsToRender.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-base transition-all duration-200 group relative',
                  isActive
                  ? 'bg-red-50 text-[#fe0000] shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-[#fe0000] rounded-r-full" />
              )}
              
              <item.icon 
                className={cn(
                  "h-6 w-6 transition-colors", 
                  isActive ? "text-[#fe0000]" : "text-gray-400 group-hover:text-gray-600"
                )} 
              />
              <span className="font-body">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-gray-50 bg-gray-50/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-50 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-100 z-50 lg:hidden shadow-2xl"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-72 transition-all duration-300">
        
        {/* Top Header */}
        <header className="h-20 sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-5 lg:px-12 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-display text-2xl font-bold text-gray-900 hidden sm:block tracking-tight flex items-center gap-2">
              <span>Hi, {getGreeting()}</span>
              <span role="img" aria-label="wave">👋</span>
            </h1>
          </div>

          {/* User Profile & Tools */}
          <div className="flex items-center gap-6">
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="font-display text-base font-bold text-gray-900">{profile?.name || 'User'}</p>
                <p className="font-body text-sm text-gray-500 font-medium">
                  {profile?.role && roleLabels[profile.role] || 'Member'}
                </p>
              </div>
              <div className="h-11 w-11 rounded-full bg-red-100 border-2 border-white shadow-sm flex items-center justify-center text-[#fe0000]">
                <User className="h-6 w-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-auto">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
        
        <div className="px-8 pb-6">
          <Footer />
        </div>
      </div>
    </div>
  );
}