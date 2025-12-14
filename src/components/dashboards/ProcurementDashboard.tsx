import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, AlertTriangle, Search, Filter, FileText, Download, X, Eye, 
  Loader2, BrainCircuit, ArrowRight, RefreshCcw, TrendingUp, Globe, ShieldAlert, ExternalLink, Calendar, Clock, ShoppingBag
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RequestCard } from '@/components/shared/RequestCard';
import { listenProcurementMemos, updateMemoAction, updateMemoAnalysis, Memo } from '@/lib/memos';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';

// --- CONFIG ---
const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = 'gemini-1.5-flash';

// --- HELPER: CLEAN JSON (Fixes SyntaxError) ---
const cleanJson = (text: string) => {
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

// --- HELPER: Iframe Content ---
const getIframeContent = (request: Memo) => {
  const r = request as any; 
  const rawContent = (
    typeof r.memo === 'string' ? r.memo : (r.memo?.body || request.body || '<h3>No memo content available</h3>')
  ).toString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base href="${window.location.origin}/" />
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; background: #fff; display: flex; flex-direction: column; align-items: center; color: #1f2937; }
          table, div { max-width: 100%; }
          img { max-width: 150px; height: auto; display: block; margin: 0 auto 20px; }
          .container { width: 100%; max-width: 700px; }
        </style>
      </head>
      <body><div class="container">${rawContent}</div></body>
    </html>
  `;
};

export function ProcurementDashboard() {
  const [requests, setRequests] = useState<Memo[]>([]);
  const [history, setHistory] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Memo | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // AI Analysis State
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analyzingReq, setAnalyzingReq] = useState<Memo | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>(''); 

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // --- LISTENERS ---
  useEffect(() => {
    const unsub = listenProcurementMemos((list) => {
      // Filter for strictly pending procurement items for the top list
      const pending = list.filter(r => r.route === 'procurement' && r.status === 'pending');
      setRequests(pending);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // History Listener (Approvals & Completed)
    const q = query(collection(db, 'memos'), where('procurementApprovedAt', '!=', null));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: Memo[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Memo) }));
      items.sort((a: any, b: any) => new Date(b.procurementApprovedAt).getTime() - new Date(a.procurementApprovedAt).getTime());
      setHistory(items);
    });
    return () => unsub();
  }, []);

  // Notification Timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- ACTIONS ---
  const handleDownloadMemo = () => {
    if (!viewingMemo) return;
    const content = getIframeContent(viewingMemo);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = viewingMemo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `Memo-${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApprove = async (request: Memo) => {
    if (!request.id) return;
    setProcessingId(request.id);
    try {
      await updateMemoAction(request.id, 'approve', 'procurement');
      setNotification({ type: 'success', message: 'Request forwarded to Internal Audit' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to approve request' });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (request: Memo) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest || !selectedRequest.id) return;
    setProcessingId(selectedRequest.id);
    try {
      await updateMemoAction(selectedRequest.id, 'reject', 'procurement', { reason: rejectReason });
      setNotification({ type: 'success', message: 'Rejection sent to requester' });
      setRejectModalOpen(false);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to reject request' });
    } finally {
      setProcessingId(null);
    }
  };

  // --- AI ANALYSIS ---
  const runAiAnalysis = async (request: Memo) => {
    setAnalyzingReq(request);
    setAnalysisModalOpen(true);
    setAnalysisStep('scanning');

    try {
      const totalAmount = request.amount || 0;
      const currency = request.currency || 'NGN';
      
      const rawMemo = typeof (request as any).memo === 'string' 
        ? (request as any).memo 
        : (((request as any).memo?.body) || request.body || '');
      
      const cleanMemoText = rawMemo.replace(/<[^>]*>?/gm, ' '); 
      
      const context = `
        REQUEST TITLE: ${request.title}
        TOTAL AMOUNT: ${currency} ${totalAmount}
        MEMO CONTENT: 
        ${cleanMemoText}
      `;

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const prompt = `
        You are an expert Procurement Auditor and Price Integrity Engine.
        
        TASK:
        Analyze the "MEMO CONTENT" below. Identify EVERY item listed and cross-check its implied unit price against real-world market rates (focusing on Nigeria/Africa if currency is NGN, otherwise Global).

        INPUT DATA:
        ${context}

        OUTPUT FORMAT (JSON ONLY):
        {
          "status": "high" | "fair" | "low",
          "reasoning": "Brief summary.",
          "breakdown": [
            {
              "name": "Item Name",
              "quoted": Number,
              "marketRange": "String",
              "status": "Critical" | "High" | "Fair" | "Low",
              "sources": [{ "name": "Google", "url": "..." }]
            }
          ]
        }
      `;

      setTimeout(() => setAnalysisStep('searching'), 2000);
      setTimeout(() => setAnalysisStep('comparing'), 4000);

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonStr = cleanJson(responseText);
      
      let analysisData;
      try {
         analysisData = JSON.parse(jsonStr);
      } catch (e) {
         throw new Error("AI response was not valid JSON");
      }

      if (request.id) await updateMemoAnalysis(request.id, analysisData);

      setAnalyzingReq(prev => prev ? { ...prev, aiAnalysis: analysisData } : null);
      setAnalysisStep('complete');

    } catch (error) {
      console.error("AI Analysis Failed", error);
      toast.error("AI Analysis failed. Please try again.");
      setAnalysisModalOpen(false);
    }
  };

  const filteredRequests = requests.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // NEW: Filter for Purchased Items from History
  const purchasedItems = history.filter(r => r.purchaseReceiptUrl);

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-[#fe0000] h-8 w-8" /></div>;

  return (
    <div className="space-y-10 font-sans pb-20 relative">
      
      {/* NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-10 left-1/2 z-[100] px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="font-display text-3xl font-bold text-gray-900">Procurement Overview</h1><p className="text-gray-500 mt-1">Review and validate incoming requisition requests.</p></div>
        <div className="relative w-full md:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white" /></div>
      </div>

      {/* PENDING LIST */}
      <div className="space-y-4">
        <div className="flex items-center gap-2"><h2 className="font-display text-lg font-semibold text-gray-900">Pending Review</h2><Badge variant="secondary" className="bg-red-50 text-red-700">{filteredRequests.length}</Badge></div>
        <div className="grid gap-6">
          {filteredRequests.map(request => (
            <div key={request.id} className="group relative">
              <RequestCard request={request} />
              <div className="mt-[-1rem] mx-4 p-4 pt-6 bg-white border-x border-b border-gray-100 rounded-b-xl shadow-sm flex flex-wrap justify-between items-center gap-4 relative z-0">
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" onClick={() => setViewingMemo(request)} className="text-gray-600 hover:text-[#fe0000]"><Eye className="mr-2 h-4 w-4" />View Memo</Button>
                   <Button variant="outline" size="sm" onClick={() => runAiAnalysis(request)} className="text-gray-600 hover:text-[#fe0000]"><BrainCircuit className="mr-2 h-4 w-4" />AI Price Check</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => openRejectModal(request)} disabled={processingId === request.id} className="text-red-600 hover:bg-red-50"><X className="mr-2 h-4 w-4" />Reject</Button>
                  <Button onClick={() => handleApprove(request)} disabled={processingId === request.id} className="bg-[#fe0000] hover:bg-[#d50000] text-white">{processingId === request.id ? <Loader2 className="animate-spin h-4 w-4" /> : <>Approve <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT HISTORY */}
      <div className="pt-8 border-t border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2"><Clock className="h-5 w-5 text-gray-400" />Recent Approvals</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="divide-y divide-gray-100">
               {history.slice(0, 5).map((item) => (
                 <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
                       <div>
                          <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1"><span className="font-mono">₦{(item.amount || 0).toLocaleString()}</span><span>•</span><span className="flex items-center gap-1"><Calendar size={12} />{item.procurementApprovedAt ? new Date(item.procurementApprovedAt).toLocaleDateString() : 'N/A'}</span></div>
                       </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setViewingMemo(item)}><FileText className="mr-2 h-4 w-4 text-gray-400" />View Memo</Button>
                 </div>
               ))}
             </div>
        </div>
      </div>

      {/* NEW: VERIFIED PURCHASES SECTION */}
      <div className="pt-8 border-t border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
           <ShoppingBag className="h-5 w-5 text-green-600" />
           Verified Purchases 
           <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{purchasedItems.length}</Badge>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {purchasedItems.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                 No verified purchases yet.
                 <p className="text-xs text-gray-300 mt-1">Items appear here when requester uploads receipt.</p>
              </div>
           ) : (
              purchasedItems.map((item) => (
                 <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                       <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Purchased</Badge>
                          <span className="text-xs text-gray-400 font-mono">
                             {item.purchaseConfirmedAt ? new Date(item.purchaseConfirmedAt).toLocaleDateString() : 'N/A'}
                          </span>
                       </div>
                       <h4 className="font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                       <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <BrainCircuit size={10} /> {item.department || 'General'}
                       </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                       <span className="font-mono font-bold text-gray-900">₦{(item.paidAmount || item.amount || 0).toLocaleString()}</span>
                       <a 
                          href={item.purchaseReceiptUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-2 py-1 rounded-md"
                       >
                          View Receipt <ExternalLink size={10} />
                       </a>
                    </div>
                 </div>
              ))
           )}
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {viewingMemo && ( 
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                   <div className="flex items-center gap-2"><div className="bg-red-50 p-2 rounded-lg text-[#fe0000]"><FileText size={20} /></div><h3 className="font-bold text-gray-900">{viewingMemo.title}</h3></div>
                   <button onClick={() => setViewingMemo(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="flex-1 bg-gray-100 relative"><iframe srcDoc={getIframeContent(viewingMemo)} className="w-full h-full border-0" title="Memo" /></div>
                <div className="p-4 border-t flex justify-end gap-3 bg-white"><Button variant="outline" onClick={() => setViewingMemo(null)}>Close</Button><Button className="bg-[#fe0000] text-white" onClick={handleDownloadMemo}><Download className="mr-2 h-4 w-4" /> Download</Button></div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {rejectModalOpen && ( 
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                   <div className="text-center mb-6"><div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3"><AlertTriangle size={24} /></div><h3 className="text-xl font-bold text-gray-900">Reject Request</h3></div>
                   <Textarea placeholder="Reason..." className="min-h-[100px] mb-6" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                   <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setRejectModalOpen(false)}>Cancel</Button><Button className="flex-1 bg-red-600 text-white" onClick={handleReject}>{processingId ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm'}</Button></div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* AI COMPLIANCE MODAL */}
      <AnimatePresence>
        {analysisModalOpen && analyzingReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 p-2.5 rounded-xl text-[#fe0000]">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900">AI Price Integrity Check</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Automated Market Valuation & Anomaly Detection</p>
                  </div>
                </div>
                <button onClick={() => setAnalysisModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {analysisStep !== 'complete' ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                     <div className="relative">
                        <div className="h-20 w-20 rounded-full border-4 border-red-50 border-t-[#fe0000] animate-spin"></div>
                        <Globe className="absolute inset-0 m-auto h-8 w-8 text-gray-300 animate-pulse" />
                     </div>
                     <div>
                        <p className="font-bold text-lg text-gray-900 capitalize">
                          {analysisStep === 'scanning' && 'Scanning Memo Items...'}
                          {analysisStep === 'searching' && 'Indexing Market Prices...'}
                          {analysisStep === 'comparing' && 'Detecting Anomalies...'}
                          {analysisStep === 'initializing' && 'Initializing AI Auditor...'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                           Cross-referencing request details against global and local market indices...
                        </p>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className={`p-4 rounded-xl flex items-start gap-4 ${
                       analyzingReq.aiAnalysis?.status === 'high' ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'
                    }`}>
                       {analyzingReq.aiAnalysis?.status === 'high' 
                          ? <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                          : <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                       }
                       <div>
                          <h4 className={`font-bold text-base ${analyzingReq.aiAnalysis?.status === 'high' ? 'text-red-800' : 'text-green-800'}`}>
                            {analyzingReq.aiAnalysis?.status === 'high' ? 'Risk Alert: Prices Exceed Market Value' : 'Compliance Verified: Prices are Fair'}
                          </h4>
                          <p className={`text-sm mt-1 leading-relaxed ${analyzingReq.aiAnalysis?.status === 'high' ? 'text-red-700' : 'text-green-700'}`}>
                            {analyzingReq.aiAnalysis?.reasoning}
                          </p>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Itemized Analysis</h4>
                         <span className="text-xs text-gray-400">Source: AI Market Index & Live Search Matches</span>
                      </div>
                      
                      <div className="grid gap-4">
                        {((analyzingReq.aiAnalysis as any)?.breakdown || []).map((item: any, idx: number) => (
                          <div key={idx} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <h5 className="font-bold text-gray-900 text-lg">{item.name}</h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-gray-500 bg-gray-50 border-gray-200">
                                      Quoted: ₦{(item.quoted || 0).toLocaleString()}
                                    </Badge>
                                    <ArrowRight className="h-3 w-3 text-gray-300" />
                                    <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">
                                      Market: {item.marketRange}
                                    </Badge>
                                  </div>
                               </div>
                               <Badge className={
                                 item.status === 'Critical' || item.status === 'High' ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                 : item.status === 'Low' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                 : 'bg-green-100 text-green-700 hover:bg-green-200'
                               }>
                                  {item.status === 'Critical' ? 'Overpriced' : item.status === 'Low' ? 'Underpriced' : item.status}
                               </Badge>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                               <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1">
                                 <Globe size={10} /> Verify Prices Online
                               </p>
                               <div className="space-y-2">
                                  {item.sources?.map((source: any, sIdx: number) => (
                                    <a key={sIdx} href={source.url} target="_blank" rel="noreferrer" className="flex items-center justify-between group hover:bg-white p-1.5 rounded transition-colors cursor-pointer">
                                       <span className="text-sm text-gray-600 font-medium group-hover:text-blue-600">{source.name}</span>
                                       <ExternalLink size={12} className="text-gray-300 group-hover:text-blue-400" />
                                    </a>
                                  ))}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button variant="outline" className="flex-1 h-11 border-gray-200" onClick={() => setAnalysisModalOpen(false)}>
                        Close Report
                      </Button>
                      <Button 
                        className="flex-1 h-11 bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => runAiAnalysis(analyzingReq)}
                      >
                         <RefreshCcw className="mr-2 h-4 w-4" />
                         Re-Run Verification
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}