import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, AlertTriangle, FileText, Search, Loader2, Upload, 
  CheckCircle2, XCircle, Scale, Eye, Gavel, FileWarning, Edit3, Save, RotateCcw, FileType
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RequestCard } from '@/components/shared/RequestCard';
import { listenAuditMemos, updateMemoAction, updateMemoAudit, Memo } from '@/lib/memos';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';

// --- CONFIG ---
const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = 'gemini-flash-latest';

// --- HELPER: CLEAN JSON (CRITICAL FIX) ---
// This strips out "Here is your JSON..." text and Markdown code blocks
const cleanJson = (text: string) => {
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

// --- SAMPLE POLICY TEXT ---
const SAMPLE_POLICY_TEXT = `CORPORATE SPENDING POLICY (2025)

1. SPENDING LIMITS:
   - Tier 1 (N0 - N500,000): Dept Head Approval.
   - Tier 2 (N500,001 - N5,000,000): Procurement Manager Approval.
   - Tier 3 (N5M - N20M): CFO Approval.
   - Tier 4 (> N20M): Executive Board Approval.

2. PROHIBITED ITEMS:
   - Alcoholic Beverages (Except CEO-approved Galas).
   - Personal Gifts > N50,000.
   - Luxury Goods & Jewelry.
   - Gambling/Betting services.
   - Political Donations.

3. TRAVEL & LOGISTICS:
   - Economy Class only for domestic flights.
   - Diesel limit: N5,000,000 per branch/month.
`;

// --- HELPER ---
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export function AuditDashboard() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- POLICY MANAGEMENT STATE ---
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);
  const [policyMode, setPolicyMode] = useState<'pdf' | 'text'>('pdf'); 
  
  // PDF State
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  
  // Text/Edit State
  const [manualPolicyText, setManualPolicyText] = useState(SAMPLE_POLICY_TEXT);
  const [isPolicySaved, setIsPolicySaved] = useState(false);

  // Analysis State
  const [isChecking, setIsChecking] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any | null>(null);

  // --- FETCH MEMOS ---
  useEffect(() => {
    const unsub = listenAuditMemos((list) => {
      setMemos(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- ACTIONS ---
  const handleApprove = async (request: Memo) => {
    if (!request.id) return;
    setProcessingId(request.id);
    try {
      await updateMemoAction(request.id, 'approve', 'audit');
      toast.success("Audit Approved");
      setViewingMemo(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: Memo) => {
    if (!request.id) return;
    setProcessingId(request.id);
    try {
      await updateMemoAction(request.id, 'reject', 'audit', { reason: "Policy Violation detected by Audit." });
      toast.success("Request Rejected");
      setViewingMemo(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  // --- AI POLICY CHECKER (FIXED) ---
  const runPolicyCheck = async () => {
    if (!viewingMemo) return;

    if (policyMode === 'pdf' && !policyFile) {
      toast.error("Please upload a PDF Policy first.");
      return;
    }
    if (policyMode === 'text' && !manualPolicyText.trim()) {
      toast.error("Policy text is empty.");
      return;
    }

    setIsChecking(true);
    setComplianceResult(null);

    // RETRY LOGIC
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempts < maxAttempts && !success) {
      try {
        attempts++;
        
        const rawMemo = typeof (viewingMemo as any).memo === 'string' 
          ? (viewingMemo as any).memo 
          : (((viewingMemo as any).memo?.body) || viewingMemo.body || '');
        
        const memoContext = `
          REQUEST TITLE: ${viewingMemo.title}
          DEPARTMENT: ${viewingMemo.department}
          TOTAL AMOUNT: ${viewingMemo.currency} ${viewingMemo.amount}
          DETAILS: ${rawMemo.replace(/<[^>]*>?/gm, ' ')}
        `;

        const prompt = `
          Act as a strict Internal Auditor.
          Task: Check the "Procurement Request" below against the provided "Corporate Policy".

          ${memoContext}

          Instructions:
          1. Compare the Request details strictly against the Policy rules.
          2. If using the Manual Policy Text provided, use that as the absolute source of truth.
          3. Identify any violations (spending limits, prohibited items, wrong approval level).
          
          Output ONLY raw JSON Format (no markdown, no intro text):
          {
            "status": "compliant" | "violation",
            "riskLevel": "low" | "medium" | "high",
            "violations": ["Rule broken 1", "Rule broken 2"],
            "reasoning": "Summary of findings."
          }
        `;

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        
        let result;
        
        // BRANCH: Send File OR Text
        if (policyMode === 'pdf' && policyFile) {
           const policyPart = await fileToGenerativePart(policyFile);
           result = await model.generateContent([prompt, policyPart as any]);
        } else {
           const textPrompt = `${prompt}\n\nCORPORATE POLICY TEXT:\n${manualPolicyText}`;
           result = await model.generateContent(textPrompt);
        }

        const text = result.response.text();
        
        // *** CLEAN JSON HERE ***
        const jsonStr = cleanJson(text);
        
        const data = JSON.parse(jsonStr);

        setComplianceResult(data);
        if (viewingMemo.id) {
          await updateMemoAudit(viewingMemo.id, data);
        }
        
        success = true;

      } catch (error: any) {
        console.error(`Attempt ${attempts} Failed:`, error);
        
        if (attempts >= maxAttempts) {
           if (error instanceof SyntaxError) {
              toast.error("AI Response invalid. Please try again.");
           } else {
              toast.error("Audit Service busy. Retrying...");
           }
        } else {
           // Short wait before retry
           await new Promise(r => setTimeout(r, 1500));
        }
      }
    }

    setIsChecking(false);
  };

  const filteredMemos = memos.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-[#fe0000] h-10 w-10" /></div>;

  return (
    <div className="space-y-8 pb-32 font-sans max-w-7xl mx-auto">
      
      {/* 1. Header & Policy Manager */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Scale className="h-8 w-8 text-[#fe0000]" />
              Internal Audit
            </h1>
            <p className="text-gray-500 mt-1">Verify compliance and enforce governance.</p>
          </div>
        </div>

        {/* POLICY EDITOR CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1 overflow-hidden">
           <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-xl mb-4 w-fit">
              <button 
                 onClick={() => setPolicyMode('pdf')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${policyMode === 'pdf' ? 'bg-white shadow-sm text-[#fe0000]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                 <FileType size={16} /> Upload PDF
              </button>
              <button 
                 onClick={() => setPolicyMode('text')}
                 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${policyMode === 'text' ? 'bg-white shadow-sm text-[#fe0000]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                 <Edit3 size={16} /> Manual Editor
              </button>
           </div>

           <div className="px-6 pb-6">
              {policyMode === 'pdf' ? (
                 <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
                    <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setPolicyFile(e.target.files?.[0] || null)} />
                    <div className="flex flex-col items-center gap-3">
                       <div className={`h-12 w-12 rounded-full flex items-center justify-center ${policyFile ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-400'}`}>
                          <FileText size={24} />
                       </div>
                       {policyFile ? (
                          <div>
                             <p className="font-bold text-gray-900">{policyFile.name}</p>
                             <p className="text-xs text-green-600 font-bold mt-1">Ready for analysis</p>
                          </div>
                       ) : (
                          <div>
                             <p className="font-medium text-gray-700">Click to upload Policy PDF</p>
                             <p className="text-xs text-gray-400">Supported format: .PDF</p>
                          </div>
                       )}
                    </div>
                 </div>
              ) : (
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-gray-500 uppercase">Policy Rules (Editable)</label>
                       <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setManualPolicyText(SAMPLE_POLICY_TEXT)} className="h-7 text-xs">
                             <RotateCcw className="mr-1 h-3 w-3" /> Load Sample
                          </Button>
                          <Button size="sm" onClick={() => setIsPolicySaved(true)} className={`h-7 text-xs ${isPolicySaved ? 'bg-green-600' : 'bg-gray-900'}`}>
                             {isPolicySaved ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Save className="mr-1 h-3 w-3" />}
                             {isPolicySaved ? 'Rules Active' : 'Set Active'}
                          </Button>
                       </div>
                    </div>
                    <Textarea 
                       value={manualPolicyText}
                       onChange={(e) => { setManualPolicyText(e.target.value); setIsPolicySaved(false); }}
                       className="min-h-[150px] font-mono text-sm bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                       placeholder="Enter policy rules here..."
                    />
                    <p className="text-[10px] text-gray-400">
                       * Edit the text above to immediately change how the AI evaluates requests.
                    </p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* 2. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Request List */}
        <div className="lg:col-span-5 space-y-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search pending audits..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
           </div>

           <div className="space-y-4">
              {filteredMemos.length === 0 && (
                 <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400 text-sm">No items pending audit.</p>
                 </div>
              )}
              {filteredMemos.map((memo) => (
                 <div 
                    key={memo.id} 
                    onClick={() => { setViewingMemo(memo); setComplianceResult(null); }}
                    className={`cursor-pointer transition-all ${viewingMemo?.id === memo.id ? 'ring-2 ring-[#fe0000] shadow-md transform scale-[1.02]' : 'hover:bg-gray-50'}`}
                 >
                    <RequestCard request={memo} />
                 </div>
              ))}
           </div>
        </div>

        {/* RIGHT: Inspection Panel */}
        <div className="lg:col-span-7">
           <AnimatePresence mode="wait">
             {viewingMemo ? (
                <motion.div 
                   key="inspector"
                   initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                   className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col"
                >
                   {/* Inspector Header */}
                   <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                      <div>
                         <h2 className="text-xl font-bold text-gray-900">{viewingMemo.title}</h2>
                         <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{viewingMemo.department}</Badge>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">₦{(viewingMemo.amount || 0).toLocaleString()}</Badge>
                         </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setViewingMemo(null)}>Close</Button>
                   </div>

                   {/* AI Compliance Section */}
                   <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                      <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="text-yellow-400" />
                            <h3 className="font-bold text-lg">AI Policy Check</h3>
                         </div>
                         <Badge className={`border-none ${policyMode === 'pdf' && policyFile ? 'bg-green-500/20 text-green-300' : policyMode === 'text' && isPolicySaved ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {policyMode === 'pdf' && policyFile ? 'PDF Active' : policyMode === 'text' && isPolicySaved ? 'Manual Rules Active' : 'Policy Inactive'}
                         </Badge>
                      </div>

                      {/* Result Area */}
                      {!complianceResult && !isChecking && (
                         <div className="text-center py-8">
                            <p className="text-slate-400 mb-4 text-sm">
                               {policyMode === 'pdf' ? 'Checking against PDF...' : 'Checking against Manual Rules...'}
                            </p>
                            <Button 
                               onClick={runPolicyCheck} 
                               disabled={policyMode === 'pdf' ? !policyFile : !manualPolicyText}
                               className="bg-white text-slate-900 hover:bg-gray-100 font-bold"
                            >
                               <Gavel className="mr-2 h-4 w-4" /> Run Compliance Check
                            </Button>
                         </div>
                      )}

                      {isChecking && (
                         <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-yellow-400 mb-3" />
                            <p className="text-slate-300 animate-pulse">Analyzing Rules...</p>
                            <p className="text-xs text-slate-500">Cross-referencing violation clauses</p>
                         </div>
                      )}

                      {complianceResult && (
                         <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className={`p-4 rounded-xl border flex items-start gap-4 mb-4 ${
                               complianceResult.status === 'violation' 
                               ? 'bg-red-500/10 border-red-500/50' 
                               : 'bg-green-500/10 border-green-500/50'
                            }`}>
                               {complianceResult.status === 'violation' 
                                  ? <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
                                  : <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" />
                               }
                               <div>
                                  <h4 className={`font-bold text-lg ${complianceResult.status === 'violation' ? 'text-red-400' : 'text-green-400'}`}>
                                     {complianceResult.status === 'violation' ? 'Policy Violation Detected' : 'Compliance Verified'}
                                  </h4>
                                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{complianceResult.reasoning}</p>
                                  
                                  {complianceResult.violations?.length > 0 && (
                                     <ul className="mt-3 space-y-1">
                                        {complianceResult.violations.map((v: string, i: number) => (
                                           <li key={i} className="text-xs font-bold text-red-300 flex items-center gap-2">
                                              <XCircle size={12} /> {v}
                                           </li>
                                        ))}
                                     </ul>
                                  )}
                               </div>
                            </div>
                            
                            <div className="flex justify-end">
                               <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={runPolicyCheck}>
                                  <div className="flex items-center gap-2 text-xs">
                                     Re-run Check
                                  </div>
                               </Button>
                            </div>
                         </div>
                      )}
                   </div>

                   {/* Memo Details */}
                   <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Request Details</h4>
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-sm leading-relaxed text-gray-700">
                         {/* Safe Rendering */}
                         <div dangerouslySetInnerHTML={{ 
                            __html: (viewingMemo as any).memo || viewingMemo.body 
                         }} />
                      </div>
                   </div>

                   {/* Footer Actions */}
                   <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                      <Button 
                         variant="outline" 
                         className="flex-1 h-12 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                         onClick={() => handleReject(viewingMemo)}
                         disabled={!!processingId}
                      >
                         {processingId ? <Loader2 className="animate-spin" /> : <><FileWarning className="mr-2 h-4 w-4" /> Reject Request</>}
                      </Button>
                      
                      <Button 
                         className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                         onClick={() => handleApprove(viewingMemo)}
                         disabled={!!processingId || (complianceResult?.status === 'violation')}
                      >
                         {processingId ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Approve Audit</>}
                      </Button>
                   </div>

                </motion.div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                   <div className="h-20 w-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                      <Scale className="h-10 w-10 text-gray-300" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900">Select a Request</h3>
                   <p className="text-gray-500 max-w-xs mt-2">Choose a pending request from the left to inspect details and run policy checks.</p>
                </div>
             )}
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
}