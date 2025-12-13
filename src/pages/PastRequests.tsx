import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider, useApp, RequestStatus } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { RequestCard } from '@/components/shared/RequestCard';

function PastRequestsContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const { logout } = useAuth();
  const { requests } = useApp();

  const handleLogout = () => logout();

  const filtered = requests.filter((r) => {
    const byStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const byDept = departmentFilter === '' || r.department.toLowerCase().includes(departmentFilter.toLowerCase());
    const bySearch =
      search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase());
    return byStatus && byDept && bySearch;
  });

  return (
    <DashboardLayout
      onNewRequest={() => {}}
      onLogout={handleLogout}
      currentView={currentView}
      onViewChange={setCurrentView}
      showNewRequest={false}
    >
      <AnimatePresence mode="wait">
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">Past Requests</h2>
            <p className="font-body text-sm text-muted-foreground">Filter and review historical requests</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border rounded-lg p-4">
            <div>
              <Label className="font-body text-sm">Status</Label>
              <select className="mt-1 w-full border rounded px-2 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <option value="ALL">All</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_PROCUREMENT">Pending Procurement</option>
                <option value="PENDING_AUDIT">Pending Audit</option>
                <option value="PENDING_FINANCE">Pending Finance</option>
                <option value="PAID">Approved & Paid</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <Label className="font-body text-sm">Department</Label>
              <Input className="mt-1" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} placeholder="e.g., Engineering" />
            </div>
            <div>
              <Label className="font-body text-sm">Search</Label>
              <Input className="mt-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or description" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg border border-border">
              <p className="font-body text-muted-foreground">No matching requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => (
                <RequestCard key={req.id} request={req} showDetails />
              ))}
            </div>
          )}
        </div>
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function PastRequestsPage() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppProvider>
      <PastRequestsContent />
    </AppProvider>
  );
}
