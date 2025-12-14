import { useEffect, useState, useMemo } from 'react';
import { 
  CheckCircle2, Wallet, Loader2, BrainCircuit, XCircle, Upload, 
  Clock, Building2, ArrowUpRight, TrendingUp, ArrowRight, Eye,
   AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RequestCard } from '@/components/shared/RequestCard';
import { listenFinanceMemos, updateMemoAction, Memo } from '@/lib/memos';
import { updateDepartmentSpend } from '@/lib/repositories/departments';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// --- CONFIGURATION ---
const DEFAULT_BUDGET = 20000000; // 20 Million per Dept
const DEPARTMENTS = [
  { id: 'IT', name: 'Tech & IT', color: '#3b82f6' },      // Blue
  { id: 'HR', name: 'Human Resources', color: '#ec4899' }, // Pink
  { id: 'OPS', name: 'Operations', color: '#f59e0b' },     // Orange
  { id: 'MKT', name: 'Marketing', color: '#10b981' },      // Green
];

// --- HELPER: NORMALIZE DEPT NAMES ---
const normalizeDepartment = (deptName: string | undefined): string => {
  if (!deptName) return 'OPS';
  const d = deptName.toUpperCase();
  if (d.includes('IT') || d.includes('TECH') || d.includes('INFORMATION')) return 'IT';
  if (d.includes('HUMAN') || d.includes('HR')) return 'HR';
  if (d.includes('MARKET') || d.includes('BRAND')) return 'MKT';
  return 'OPS'; 
};

// --- COMPONENT: CIRCULAR PROGRESS ---
const CircularBudget = ({ label, total, spent, color }: { label: string, total: number, spent: number, color: string }) => {
  const percentage = Math.min((spent / total) * 100, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
      <div className="relative h-32 w-32 mb-4">
        {/* Background Circle */}
        <svg className="h-full w-full transform -rotate-90">
          <circle cx="64" cy="64" r={radius} stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
          {/* Progress Circle */}
          <motion.circle 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="64" cy="64" r={radius} 
            stroke={color} 
            strokeWidth="8" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeLinecap="round"
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-gray-900">{percentage.toFixed(0)}%</span>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Used</span>
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-bold text-gray-800 text-sm mb-1">{label}</h4>
        <div className="flex flex-col text-xs font-mono">
           <span className="text-gray-900 font-bold">₦{spent.toLocaleString()}</span>
           <span className="text-gray-400">/ ₦{(total / 1000000)}M</span>
        </div>
      </div>
    </div>
  );
};

export function FinanceDashboard() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal States
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<string>(''); 
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // --- DATA PROCESSING ---
  const pendingPayments = memos.filter(r => r.route === 'finance' && r.status === 'pending');
  const paidRequests = memos.filter(r => {
    const s = (r.status as string).toLowerCase();
    return s === 'paid' || s === 'completed';
  });

  // Calculate Spend Per Dept
  const deptAnalytics = useMemo(() => {
    const spending: Record<string, number> = { 'IT': 0, 'HR': 0, 'OPS': 0, 'MKT': 0 };
    paidRequests.forEach(req => {
      const r = req as any;
      const deptId = normalizeDepartment(r.department);
      const cost = Number(r.paidAmount !== undefined ? r.paidAmount : (r.amount || r.price || 0));
      if (spending[deptId] !== undefined) spending[deptId] += cost;
      else spending['OPS'] += cost; 
    });
    return spending;
  }, [paidRequests]);

  // Key Metrics: Latest & Highest
  const latestTx = useMemo(() => {
    if (paidRequests.length === 0) return null;
    return [...paidRequests].sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }, [paidRequests]);

  const highestTx = useMemo(() => {
    if (paidRequests.length === 0) return null;
    return [...paidRequests].sort((a: any, b: any) => 
       (b.paidAmount || b.amount || 0) - (a.paidAmount || a.amount || 0)
    )[0];
  }, [paidRequests]);

  // AI Logic
  const aiInsight = useMemo(() => {
    const totalSpent = Object.values(deptAnalytics).reduce((acc, val) => acc + val, 0);
    const totalBudget = DEFAULT_BUDGET * 4;
    const burnRate = (totalSpent / totalBudget) * 100;

    let text = "Spending is within safe limits.";
    let sentiment = "good";

    if (burnRate > 75) {
       text = "CRITICAL: Global burn rate exceeds 75%. Liquidity crunch imminent.";
       sentiment = "critical";
    } else if (burnRate > 50) {
       text = "Moderate spending activity. Operations department is driving volume.";
       sentiment = "neutral";
    }

    return { text, sentiment, burnRate };
  }, [deptAnalytics]);

  // --- ACTIONS ---

  // *** FIX: Added missing openPayModal function ***
  const openPayModal = (request: any) => {
    setSelectedRequest(request);
    // Pre-fill amount with request amount
    setPaymentAmount((request.amount || request.price || 0).toString());
    setReceiptFile(null);
    setPayModalOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    const actualPaidAmount = parseFloat(paymentAmount) || 0;

    try {
      let receiptUrl = receiptFile ? URL.createObjectURL(receiptFile) : '';

      if (selectedRequest.id) {
          await updateMemoAction(selectedRequest.id, 'pay', 'finance', { 
            receiptUrl, 
            paidAmount: actualPaidAmount 
          } as any);
      }
      
      const r = selectedRequest as any;
      const dept = (r.department as string) || 'General';
      if (dept && actualPaidAmount > 0) {
        await updateDepartmentSpend(dept, actualPaidAmount);
      }
      
      // Optimistic Update
      setMemos(prev => prev.map(m => m.id === selectedRequest.id ? { 
          ...m, status: 'paid', route: 'completed', paidAmount: actualPaidAmount, updatedAt: new Date().toISOString() 
      } as any : m));

      toast.success(`Paid ₦${actualPaidAmount.toLocaleString()}`);
      setPayModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Payment failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const submitRejection = async () => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    try {
      await updateMemoAction(selectedRequest.id, 'reject', 'finance', { reason: rejectReason });
      setRejectModalOpen(false);
      toast.success("Request Rejected");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- LISTENERS ---
  useEffect(() => {
    const unsub = listenFinanceMemos((list) => {
        setMemos(list);
        setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-gray-300 h-10 w-10" /></div>;

  return (
    <div className="space-y-10 pb-32 font-sans max-w-7xl mx-auto px-4">
      
      {/* 1. HEADER */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Financial Control Center</h1>
        <p className="text-gray-500 mt-1">Real-time budget monitoring and disbursement.</p>
      </div>

      {/* 2. CIRCULAR BUDGETS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DEPARTMENTS.map((dept) => (
           <CircularBudget 
             key={dept.id}
             label={dept.name} 
             color={dept.color} 
             total={DEFAULT_BUDGET} 
             spent={deptAnalytics[dept.id] || 0} 
           />
        ))}
      </div>

      {/* 3. ANALYTICS & METRICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Left: AI Insight */}
         <div className="lg:col-span-6 bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/10 p-2 rounded-lg"><BrainCircuit className="text-[#fe0000]" /></div>
                  <h3 className="font-bold text-lg">AI Cashflow Analysis</h3>
               </div>
               <p className="text-gray-300 font-light leading-relaxed text-lg">{aiInsight.text}</p>
            </div>
            <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
               <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Liquidity Used</p>
                  <p className="text-3xl font-mono font-bold text-white mt-1">{aiInsight.burnRate.toFixed(1)}%</p>
               </div>
               <TrendingUp className="text-white/20 h-16 w-16" />
            </div>
         </div>

         {/* Right: Key Metrics Cards */}
         <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* LATEST SPENDING */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
               <div className="flex justify-between items-start">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Clock size={20} /></div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500">Just Now</Badge>
               </div>
               <div className="mt-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Latest Spending</p>
                  {latestTx ? (
                    <>
                      <h4 className="text-xl font-bold text-gray-900 mt-1 truncate">{latestTx.title}</h4>
                      <p className="font-mono text-blue-600 font-bold mt-1">₦{Number(latestTx.paidAmount || latestTx.amount).toLocaleString()}</p>
                      <button onClick={() => setViewingMemo(latestTx)} className="mt-4 text-xs font-bold flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                         View Details <ArrowRight size={12} />
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-300 text-sm mt-2 italic">No transactions yet.</p>
                  )}
               </div>
            </div>

            {/* HIGHEST SPENDER */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
               <div className="flex justify-between items-start">
                  <div className="bg-orange-50 text-orange-600 p-2 rounded-xl"><TrendingUp size={20} /></div>
               </div>
               <div className="mt-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Highest Payment</p>
                  {highestTx ? (
                    <>
                      <h4 className="text-xl font-bold text-gray-900 mt-1 truncate">{highestTx.title}</h4>
                      <p className="font-mono text-orange-600 font-bold mt-1">₦{Number(highestTx.paidAmount || highestTx.amount).toLocaleString()}</p>
                      <button onClick={() => setViewingMemo(highestTx)} className="mt-4 text-xs font-bold flex items-center gap-1 text-gray-400 hover:text-orange-600 transition-colors">
                         View Details <ArrowRight size={12} />
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-300 text-sm mt-2 italic">No transactions yet.</p>
                  )}
               </div>
            </div>

         </div>
      </div>

      {/* 4. PENDING ACTIONS */}
      <div className="space-y-6">
         <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
            Pending Approvals <Badge className="bg-red-50 text-red-600 hover:bg-red-50">{pendingPayments.length}</Badge>
         </h2>
         <div className="grid gap-6">
            {pendingPayments.length === 0 ? (
               <div className="text-center py-16 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No pending payments.</p>
               </div>
            ) : (
               pendingPayments.map((req) => (
                  <div key={req.id} className="group">
                     <RequestCard request={req} />
                     <div className="mt-[-1.5rem] mx-6 p-4 pt-8 bg-white border-x border-b border-gray-100 rounded-b-3xl shadow-sm flex justify-between items-center relative z-0">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Building2 size={16} />
                           <span>Budget: </span>
                           <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                              {normalizeDepartment(req.department)}
                           </span>
                        </div>
                        <div className="flex gap-2">
                           <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(req); setRejectModalOpen(true); }} className="text-red-600 border-red-100 hover:bg-red-50">
                              Reject
                           </Button>
                           <Button size="sm" onClick={() => openPayModal(req)} className="bg-[#fe0000] hover:bg-red-700 text-white">
                              Approve & Pay
                           </Button>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* 5. PAYMENT HISTORY */}
      <div className="space-y-6 pt-8 border-t border-gray-100">
         <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 size={16} /></div>
            <h2 className="text-xl font-display font-bold text-gray-900">Payment History</h2>
         </div>
         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {paidRequests.length === 0 ? (
               <div className="p-12 text-center text-gray-400 italic text-sm">No history available.</div>
            ) : (
               <div className="divide-y divide-gray-100">
                  {paidRequests.map((item: any) => (
                     <div key={item.id} className="p-5 hover:bg-gray-50 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                              <ArrowUpRight size={18} />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                 <span className="flex items-center gap-1 bg-gray-100 px-2 rounded">{normalizeDepartment(item.department)}</span>
                                 <span>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Just now'}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <p className="font-mono font-bold text-gray-900 text-sm">₦{(item.paidAmount || item.amount).toLocaleString()}</p>
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] px-1.5 py-0">PAID</Badge>
                           </div>
                           <Button size="icon" variant="ghost" onClick={() => setViewingMemo(item)}>
                              <Eye className="text-gray-400" size={18} />
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. PAYMENT MODAL */}
      <AnimatePresence>
        {payModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-gray-50 p-6 border-b border-gray-100">
                   <h3 className="text-lg font-bold text-gray-900">Approve Disbursement</h3>
                   <p className="text-sm text-gray-500">Confirm amount and upload proof of payment.</p>
                </div>
                <div className="p-8 space-y-6">
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between">
                      <span className="text-sm font-bold text-blue-900">Requested Amount</span>
                      <span className="text-sm font-mono font-bold text-blue-700">₦{(selectedRequest?.amount || 0).toLocaleString()}</span>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Actual Amount Paid</label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">₦</span>
                         <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="pl-8 h-12 font-mono font-bold text-lg" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Receipt / Proof</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer relative">
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                         {receiptFile ? <div className="text-green-600 font-bold flex items-center justify-center gap-2"><CheckCircle2 size={16}/> {receiptFile.name}</div> : <div className="text-gray-400 flex flex-col items-center"><Upload size={24} className="mb-2"/> Click to upload</div>}
                      </div>
                   </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex gap-3">
                   <Button variant="ghost" className="flex-1" onClick={() => setPayModalOpen(false)}>Cancel</Button>
                   <Button className="flex-[2] bg-[#fe0000] hover:bg-red-700 text-white font-bold" onClick={submitPayment} disabled={!paymentAmount}>
                      {processingId ? <Loader2 className="animate-spin" /> : 'Confirm Payment'}
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. REJECT MODAL */}
      <AnimatePresence>
         {rejectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
                  <div className="text-center mb-6">
                     <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle size={24} /></div>
                     <h3 className="text-lg font-bold text-gray-900">Reject Request</h3>
                  </div>
                  <Textarea placeholder="Reason for rejection..." className="min-h-[100px] mb-6" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <div className="flex gap-3">
                     <Button variant="outline" className="flex-1" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                     <Button className="flex-1 bg-red-600 text-white font-bold" onClick={submitRejection}>{processingId ? <Loader2 className="animate-spin" /> : 'Reject'}</Button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* 3. VIEW MEMO MODAL */}
      <AnimatePresence>
        {viewingMemo && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
                 <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">{viewingMemo.title}</h3>
                    <button onClick={() => setViewingMemo(null)}><XCircle className="text-gray-400 hover:text-red-500" /></button>
                 </div>
                 <div className="flex-1 p-8 overflow-y-auto">
                    <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: (viewingMemo as any).memo || viewingMemo.body }} />
                 </div>
                 <div className="p-4 border-t bg-gray-50 text-right">
                    <Button onClick={() => setViewingMemo(null)}>Close</Button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
}