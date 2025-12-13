import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertCircle, Loader2, Sparkles, 
  Search, FileText, TrendingUp, ShieldCheck, Eye, Download, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useProcurementMemos } from '@/pages/ProcurementPage'; 
import { updateMemoAnalysis, Memo } from '@/lib/memos';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsPDF } from "jspdf";

// --- AI CONFIG ---
const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = 'gemini-flash-latest'; 

export function ProcurementDashboard() {
  const { profile } = useAuth();
  const { memos, loading } = useProcurementMemos();
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for the PDF Viewer Modal
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);

  const pendingRequests = memos.filter(m => m.status === 'pending');
  const pastRequests = memos.filter(m => m.status !== 'pending');

  const handleCheckPrice = async (memo: Memo) => {
    if (!memo.id || !memo.amount || !memo.title) return;
    setAnalyzingId(memo.id);
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `
        Act as a strict Procurement Auditor. Analyze this request for price compliance in Nigeria.
        Item: "${memo.title}"
        Requested Price: ${memo.currency || 'NGN'} ${memo.amount}
        Description: ${memo.body}
        Task: Compare this price against current average market rates.
        Output ONLY valid JSON: {"status": "fair"|"high"|"low", "reasoning": "Brief explanation", "estimated_market_price": "Range"}
      `;
      const result = await model.generateContent(prompt);
      const jsonStr = result.response.text().replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(jsonStr);
      await updateMemoAnalysis(memo.id, {
        status: analysis.status,
        confidence: 0.9,
        reasoning: analysis.reasoning,
        estimatedMarketPrice: analysis.estimated_market_price
      });
    } catch (err) {
      console.error("AI Check Failed", err);
      alert("AI Analysis failed. Please try again.");
    } finally {
      setAnalyzingId(null);
    }
  };

  // --- PDF GENERATION HELPERS ---
  const generatePDFBlob = (memo: Memo) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(memo.body || 'No content', 180), 15, 20);
    return doc.output('bloburl');
  };

  const downloadPDF = (memo: Memo) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(memo.body || 'No content', 180), 15, 20);
    doc.save(`${memo.title.replace(/\s+/g, '_')}_Memo.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
        <p className="font-body text-lg">Loading procurement dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. WELCOME SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.name || 'Officer'}
          </h1>
          <p className="font-body text-lg text-gray-500 max-w-2xl">
            You have <span className="font-bold text-blue-600">{pendingRequests.length} pending requests</span> awaiting price verification and approval.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
      </motion.div>

      {/* 2. PENDING REQUESTS */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-gray-800 flex items-center gap-3">
            <ShieldCheck className="text-blue-600 h-6 w-6" />
            Pending Reviews
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search requests..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-white font-body"
            />
          </div>
        </div>

        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
              <h3 className="font-display text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="font-body text-gray-500">No pending requests to review.</p>
            </div>
          ) : (
            pendingRequests
              .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((request) => (
              <RequestActionCard 
                key={request.id} 
                request={request} 
                analyzingId={analyzingId}
                onCheckPrice={() => handleCheckPrice(request)}
                onViewPdf={() => setViewingMemo(request)}
                onDownloadPdf={() => downloadPDF(request)}
              />
            ))
          )}
        </div>
      </div>

      {/* 3. PAST APPROVALS */}
      {pastRequests.length > 0 && (
        <div className="pt-8 border-t border-gray-100">
          <h3 className="font-display text-xl font-semibold text-gray-800 mb-6 opacity-70">
            Past History
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60 hover:opacity-100 transition-opacity">
            {pastRequests.slice(0, 6).map(req => (
              <div key={req.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-700 truncate max-w-[150px]">{req.title}</span>
                  <Badge variant="outline" className="text-[10px]">{req.status}</Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {req.currency} {req.amount?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL */}
      <AnimatePresence>
        {viewingMemo && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
             >
               <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                 <div className="flex items-center gap-2">
                   <FileText className="text-blue-600" size={20} />
                   <h3 className="font-bold text-gray-800">{viewingMemo.title}</h3>
                 </div>
                 <button onClick={() => setViewingMemo(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                   <X size={20} className="text-gray-500" />
                 </button>
               </div>
               <div className="flex-1 bg-gray-100 p-4">
                 <iframe 
                   src={generatePDFBlob(viewingMemo).toString()} 
                   className="w-full h-full rounded-lg shadow-inner border border-gray-200 bg-white"
                   title="Memo PDF Preview"
                 />
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- UPDATED CARD COMPONENT ---
function RequestActionCard({ request, analyzingId, onCheckPrice, onViewPdf, onDownloadPdf }: any) {
  const isHighRisk = request.aiAnalysis?.status === 'high';
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* LEFT: Request Details (SIMPLIFIED) */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                 <h3 className="font-display text-xl font-bold text-gray-900">{request.title}</h3>
                 <p className="font-body text-sm text-gray-500 flex items-center gap-2">
                   From: <span className="font-medium text-gray-700">{request.requesterName}</span> 
                   • {request.department}
                 </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-gray-800">
                  <span className="text-sm text-gray-400 font-sans mr-1">{request.currency || 'NGN'}</span>
                  {request.amount?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Requested Amount</p>
              </div>
            </div>

            {/* DOCUMENT ACTIONS (Replaces Text Body) */}
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={onViewPdf}
                className="h-10 gap-2 font-medium border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Eye size={16} />
                View PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={onDownloadPdf}
                className="h-10 gap-2 font-medium border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Download size={16} />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT: Action Center (Price Check + Decisions) */}
        <div className="w-full md:w-80 flex flex-col gap-3 border-l border-gray-100 pl-0 md:pl-6">
          
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <h4 className="font-display text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-blue-500" />
              AI Price Compliance
            </h4>
            
            {request.aiAnalysis ? (
              <div className="space-y-2 animate-in fade-in zoom-in">
                <div className={`flex items-center gap-2 text-sm font-bold ${isHighRisk ? 'text-red-600' : 'text-green-600'}`}>
                  {isHighRisk ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span className="capitalize">{request.aiAnalysis.status} Price Detected</span>
                </div>
                <p className="text-xs text-gray-600 leading-snug">
                  {request.aiAnalysis.reasoning}
                </p>
                <div className="text-xs font-mono bg-white/50 p-2 rounded border border-blue-100/50 text-gray-500">
                  Market: {request.aiAnalysis.estimatedMarketPrice}
                </div>
              </div>
            ) : (
              <Button 
                onClick={onCheckPrice}
                disabled={analyzingId === request.id}
                className="w-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-body shadow-sm"
              >
                {analyzingId === request.id ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <TrendingUp className="mr-2 h-4 w-4" />}
                Run Price Anomaly Check
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
             <Button variant="outline" className="font-body border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
               Reject
             </Button>
             <Button className="font-body bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200">
               Approve
             </Button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}