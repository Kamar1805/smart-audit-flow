import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Clock, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  listenExecutiveSharedMemos, 
  executiveApproveAndForward, 
  executiveRejectMemo 
} from '@/lib/memos';

// --- TYPES ---
import type { SharedMemo } from '@/lib/memos';

// --- HELPER: IFRAME CONTENT (Reused for consistency) ---
const getIframeContent = (title: string, body: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
          h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div>${body}</div>
      </body>
    </html>
  `;
};

function ExecutivesContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { logout, profile } = useAuth();
  
  // Data State
  const [memos, setMemos] = useState<SharedMemo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingMemo, setViewingMemo] = useState<SharedMemo | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenExecutiveSharedMemos(profile.uid, (list) => {
      setMemos(list);
      setLoading(false);
    });
    return () => unsub();
  }, [profile?.uid]);

  // 2. Separate Active vs Past
  const { activeMemos, pastMemos } = useMemo(() => {
    const active: SharedMemo[] = [];
    const past: SharedMemo[] = [];
    memos.forEach(m => {
      if (m.status === 'pending') active.push(m);
      else past.push(m);
    });
    // Sort by newest
    return {
      activeMemos: active.sort((a, b) => b.sharedAt - a.sharedAt),
      pastMemos: past.sort((a, b) => (b.actionDate ? new Date(b.actionDate).getTime() : 0) - (a.actionDate ? new Date(a.actionDate).getTime() : 0))
    };
  }, [memos]);

  // 3. Handlers
  const handleApprove = async (m: SharedMemo) => {
    setProcessingId(m.id!);
    try {
      // Pass the executive's position (e.g., "GMD") so Finance sees it
      await executiveApproveAndForward(m.id!, profile?.position || 'Executive');
      toast.success('Forwarded to Finance Department for payment');
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve memo');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (m: SharedMemo) => {
    if (!confirm('Are you sure you want to reject this memo?')) return;
    setProcessingId(m.id!);
    try {
      await executiveRejectMemo(m.id!, 'Rejected by Executive');
      toast.success('Memo rejected and returned to history');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject memo');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => logout();

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-[#fe0000] h-10 w-10" />
      </div>
    );
  }

  return (
    <DashboardLayout
      onNewRequest={() => {}}
      onLogout={handleLogout}
      currentView={currentView}
      onViewChange={setCurrentView}
      showNewRequest={false} // Executives usually don't create requests here
    >
      <div className="space-y-10 max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">Executive Overview</h2>
          <p className="text-gray-500">Review, approve, and track memos forwarded to your desk.</p>
        </div>

        {/* --- SECTION 1: PENDING REVIEW --- */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-display text-lg font-semibold text-gray-900">Pending Review</h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeMemos.length}
            </span>
          </div>

          {activeMemos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <CheckCircle2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
               <p className="text-gray-500">You're all caught up! No pending memos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {activeMemos.map((m) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id} 
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex gap-4">
                          <div className="h-12 w-12 bg-red-50 text-[#fe0000] rounded-xl flex items-center justify-center">
                             <FileText size={24} />
                          </div>
                          <div>
                             <h4 className="text-lg font-bold text-gray-900">{m.title}</h4>
                             <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="font-medium text-gray-700">{m.department}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock size={12}/> {new Date(m.sharedAt).toLocaleDateString()}</span>
                             </div>
                             <p className="text-xs text-gray-400 mt-1">Shared by: {m.sharedByName}</p>
                          </div>
                       </div>
                       <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          PENDING ACTION
                       </Badge>
                    </div>

                    {/* Financials */}
                    <div className="mb-6 bg-gray-50/50 p-3 rounded-lg border border-gray-100/50 inline-block">
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Requested Amount</p>
                        <p className="text-xl font-mono font-bold text-gray-900">
                           <span className="text-sm text-gray-500 mr-1">{m.currency}</span>
                           {m.amount.toLocaleString()}
                        </p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                       <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 gap-2" onClick={() => setViewingMemo(m)}>
                          <Eye size={16} /> View Memo
                       </Button>

                       <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-100 text-red-600 hover:bg-red-50 gap-2"
                            onClick={() => handleReject(m)}
                            disabled={!!processingId}
                          >
                             {processingId === m.id ? <Loader2 className="animate-spin h-4 w-4"/> : <ThumbsDown size={16} />}
                             Reject
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-[#fe0000] hover:bg-[#d50000] text-white gap-2 shadow-sm"
                            onClick={() => handleApprove(m)}
                            disabled={!!processingId}
                          >
                             {processingId === m.id ? <Loader2 className="animate-spin h-4 w-4"/> : <ThumbsUp size={16} />}
                             Approve
                          </Button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* --- SECTION 2: PAST MEMOS --- */}
        <section>
           <h3 className="font-display text-lg font-semibold text-gray-900 mb-4 text-opacity-60">History</h3>
           {pastMemos.length === 0 ? (
             <div className="text-sm text-gray-400 italic">No history available.</div>
           ) : (
             <div className="grid grid-cols-1 gap-4 opacity-80">
                {pastMemos.map((m) => (
                   <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                         <div className={`h-10 w-10 rounded-full flex items-center justify-center ${m.status === 'forwarded' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {m.status === 'forwarded' ? <ThumbsUp size={18} /> : <ThumbsDown size={18} />}
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-800">{m.title}</h4>
                            <p className="text-xs text-gray-500">
                               {m.status === 'forwarded' ? 'Forwarded to Finance' : 'Rejected'} • {new Date(m.actionDate || 0).toLocaleDateString()}
                            </p>
                         </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setViewingMemo(m)}>
                         View
                      </Button>
                   </div>
                ))}
             </div>
           )}
        </section>

      </div>

      {/* --- VIEW MEMO MODAL --- */}
      <AnimatePresence>
        {viewingMemo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            >
               <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                  <div>
                    <h3 className="font-display text-lg font-bold text-gray-900">{viewingMemo.title}</h3>
                    <p className="text-xs text-gray-500">Shared by {viewingMemo.sharedByName}</p>
                  </div>
                  <button onClick={() => setViewingMemo(null)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
               </div>
               <div className="flex-1 bg-white relative">
                  <iframe 
                    title="Memo Content" 
                    srcDoc={getIframeContent(viewingMemo.title, viewingMemo.body)} 
                    className="w-full h-full border-none"
                  />
               </div>
               <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <Button onClick={() => setViewingMemo(null)}>Close</Button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function ExecutivesPage() {
  return (
    <AppProvider>
      <ExecutivesContent />
    </AppProvider>
  );
}