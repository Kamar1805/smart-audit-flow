import { useState, useEffect, createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listenExecutiveSharedMemos, executiveApproveAndForward } from '@/lib/memos';

// --- TYPES ---
import type { SharedMemo as ExecSharedMemo } from '@/lib/memos';
type SharedMemo = ExecSharedMemo;

// --- CONTEXT ---
type SharedCtx = { memos: SharedMemo[]; loading: boolean };
const ExecSharedContext = createContext<SharedCtx>({ memos: [], loading: true });
export const useExecShared = () => useContext(ExecSharedContext);

function ExecutivesContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { logout, profile } = useAuth();
  const [memos, setMemos] = useState<SharedMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenExecutiveSharedMemos(profile.uid, (list: SharedMemo[]) => {
      setMemos(list);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [profile?.uid]);

  const handleLogout = () => logout();

  const renderView = () => {
    if (currentView !== 'dashboard') {
      return (
        <div className="p-6 text-gray-500">Other views coming soon.</div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="animate-spin text-[#fe0000] h-8 w-8" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">Shared Memos With You</h2>
          <p className="text-sm text-gray-500">Review and approve memos forwarded to your desk.</p>
        </div>
        {memos.length === 0 ? (
          <div className="text-sm text-gray-500">No memos shared yet.</div>
        ) : (
          memos.map((m) => (
            <motion.div key={m.id} layout className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-gray-900">{m.title}</h3>
                  <p className="text-xs text-gray-500">Shared by {m.sharedByName} • {new Date(m.sharedAt).toLocaleString()}</p>
                </div>
                {m.status !== 'forwarded' && (
                  <Button 
                    className="bg-[#fe0000] hover:bg-[#d50000] text-white"
                    onClick={async () => {
                      setProcessingId(m.id);
                      try {
                        await executiveApproveAndForward(m.id);
                        toast.success('Approved and forwarded to Finance');
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    disabled={processingId === m.id}
                  >
                    {processingId === m.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Approve & Forward'}
                  </Button>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.body}</p>
              </div>
              {m.status === 'forwarded' && (
                <div className="mt-4 flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle2 size={14} />
                  Forwarded to Finance
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    );
  };

  return (
    <ExecSharedContext.Provider value={{ memos, loading }}>
      <DashboardLayout
        onNewRequest={() => {}}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
        showNewRequest={false}
      >
        <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
      </DashboardLayout>
    </ExecSharedContext.Provider>
  );
}

export default function ExecutivesPage() {
  return (
    <AppProvider>
      <ExecutivesContent />
    </AppProvider>
  );
}
