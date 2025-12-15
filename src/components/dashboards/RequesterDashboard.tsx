import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence as FramerPresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  Share2, 
  Loader2, 
  Send, 
  ShoppingBag, 
  UploadCloud, 
  Timer, 
  CornerUpRight,
  XCircle,
  Info,
  UserCircle2,
  Briefcase
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstructionGuide } from '@/components/shared/InstructionGuide';
import { RequestCard } from '@/components/shared/RequestCard';
import { useAuth } from '@/context/AuthContext';
import { listUsersWithPhone, listExecutives } from '@/lib/repositories/users';
import { shareMemoToExecutive, listenUserMemos, Memo, confirmItemPurchase } from '@/lib/memos';
import { toast } from 'sonner';
import { jsPDF } from "jspdf"; 

interface RequesterDashboardProps {
  onNewRequest: () => void;
}

type AnyReq = any;

// ----------------------------------------------------------------------
// HELPER: GENERATE CLEAN PDF CONTENT FOR SHARING
// ----------------------------------------------------------------------
const getPdfContent = (request: AnyReq) => {
  const content = typeof request.body === 'string'
      ? request.body
      : (request.memo || request.memo?.body || request.description || '');
      
  return `
    <div style="font-family: Helvetica, sans-serif; padding: 40px; color: #000; background: #fff; width: 550px;">
      <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">Internal Memo</h1>
      <p><strong>To:</strong> Management</p>
      <p><strong>From:</strong> ${request.requesterName || 'Staff'}</p>
      <p><strong>Subject:</strong> ${request.title}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr />
      <div style="margin-top: 20px; line-height: 1.6;">
        ${content}
      </div>
    </div>
  `;
};

// ----------------------------------------------------------------------
// HELPER: IFRAME PREVIEW CONTENT
// ----------------------------------------------------------------------
const getIframeContent = (request: AnyReq) => {
  const rawContent = (
    typeof request.body === 'string'
      ? request.body
      : (request.memo || request.memo?.body || request.description || '<h3>No memo content available</h3>')
  ).toString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base href="${window.location.origin}/" />
        <style>
          body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            padding: 40px; 
            background: #fff; 
            color: #1f2937; 
            line-height: 1.5;
          }
          .container { width: 100%; max-width: 700px; margin: 0 auto; }
          img { max-width: 150px; height: auto; display: block; margin: 10px 0; }
          h1, h2, h3 { color: #111; }
          p { margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          ${rawContent}
        </div>
      </body>
    </html>
  `;
};

export function RequesterDashboard({ onNewRequest }: RequesterDashboardProps) {
  const { profile } = useAuth();
  
  // --- DATA STATE ---
  const [requests, setRequests] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UI STATES ---
  const [viewingRequest, setViewingRequest] = useState<AnyReq | null>(null);
  
  // Share Modal State
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFor, setShareFor] = useState<AnyReq | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [contacts, setContacts] = useState<Array<{ name: string; department: string; phone: string }>>([]);
  
  // Forward Modal State
  const [forwardOpen, setForwardOpen] = useState(false);
  const [executives, setExecutives] = useState<Array<{ uid: string; name: string; department: string; position?: string }>>([]);

  // Purchase Confirmation State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingReq, setConfirmingReq] = useState<Memo | null>(null);
  const [purchaseReceipt, setPurchaseReceipt] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ----------------------------------------------------------------------
  // REAL-TIME LISTENER
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!profile?.uid) return;

    // Listen to MY requests live from Firestore
    const unsub = listenUserMemos(profile.uid, (list) => {
      setRequests(list);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.uid]);

  // ----------------------------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------------------------

  // 1. Open Share Modal & Load Contacts
  const openShare = async (req: AnyReq) => {
    setShareFor(req);
    setShareOpen(true);
    try {
      const list = await listUsersWithPhone('requester');
      setContacts(list.map(u => ({ 
        name: u.name, 
        department: u.department, 
        phone: (u as any).phone 
      })));
    } catch (e) {
      console.error("Failed to load contacts", e);
      toast.error("Could not load contacts.");
    }
  };

  // 2. Open Forward Modal & Load Executives
  const openForward = async (req: AnyReq) => {
    setViewingRequest(req); 
    setForwardOpen(true);
    try {
      const list = await listExecutives();
      setExecutives(list.map(u => ({ 
        uid: (u as any).id || u.uid, 
        name: u.name, 
        department: u.department, 
        position: (u as any).position || (u as any).jobTitle || 'Executive' 
      })));
    } catch (e) {
      console.error(e);
      toast.error("Could not load executive list");
    }
  };

  // 3. Confirm Purchase Upload Logic
  const handleConfirmPurchase = async () => {
    if (!confirmingReq || !confirmingReq.id) return;
    setIsUploading(true);
    
    try {
        const mockUrl = purchaseReceipt ? URL.createObjectURL(purchaseReceipt) : "mock_receipt_url";
        
        await confirmItemPurchase(confirmingReq.id, mockUrl);
        
        toast.success("Purchase confirmed! Receipt sent to Procurement.");
        setConfirmModalOpen(false);
    } catch (e) {
        console.error(e);
        toast.error("Failed to confirm purchase. Please try again.");
    } finally {
        setIsUploading(false);
    }
  };

  const openConfirmModal = (req: Memo) => {
    setConfirmingReq(req);
    setPurchaseReceipt(null);
    setConfirmModalOpen(true);
  };

  // 4. Countdown Timer Logic
  const getCountdown = (paymentDate?: string) => {
     if (!paymentDate) return "72h 00m";
     const paidAt = new Date(paymentDate).getTime();
     const deadline = paidAt + (72 * 60 * 60 * 1000); 
     const now = new Date().getTime();
     const diff = deadline - now;

     if (diff <= 0) return "Action Overdue";
     
     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
     return `${hours}h ${minutes}m left`;
  };

  // 5. Calculate Progress Bar State
  const getProgress = (req: AnyReq) => {
    const status = (req.status as string)?.toLowerCase() || '';
    const route = ((req as any).route as string)?.toLowerCase() || '';

    if (req.purchaseReceiptUrl) {
        return { value: 100, label: 'Purchase Verified', color: 'bg-blue-600', sublabel: 'Receipt Uploaded & Verified', icon: ShoppingBag };
    }
    if (status === 'paid' || status === 'completed' || route === 'completed') {
        return { value: 100, label: 'Payment Received', color: 'bg-green-600', sublabel: 'Funds Disbursed - Please Buy Item', icon: CheckCircle2 };
    }
    if (status === 'rejected') {
        const reason = (req as any).rejectionReason || (req as any).rejectedBy || 'Approver';
        return { value: 100, label: 'Rejected', color: 'bg-red-500', sublabel: `Reason: ${reason}`, icon: XCircle };
    }
    if (route === 'finance') {
        if (status === 'approved') return { value: 95, label: 'Processing Payment', color: 'bg-green-500', sublabel: 'Sending Funds...', icon: Clock };
        return { value: 80, label: 'Finance Processing', color: 'bg-blue-600', sublabel: 'Pending Final Payment', icon: Clock };
    }
    if (route === 'audit') {
        return { value: 50, label: 'Audit Review', color: 'bg-orange-500', sublabel: 'Compliance Check', icon: Clock };
    }
    if (route === 'procurement') {
        return { value: 20, label: 'Procurement Review', color: 'bg-[#fe0000]', sublabel: 'Pending Approval', icon: Clock };
    }
    return { value: 5, label: 'Submitted', color: 'bg-gray-400', sublabel: 'Pending Processing', icon: Clock };
  };

  // 6. Filter Requests
  const { activeRequests, pastRequests } = useMemo(() => {
    const active: AnyReq[] = [];
    const past: AnyReq[] = [];
    
    for (const r of requests) {
      const status = (r.status as string)?.toLowerCase();
      const route = ((r as any).route as string)?.toLowerCase();
      const isCompleted = status === 'paid' || status === 'completed' || route === 'completed' || status === 'rejected';
      
      if (isCompleted) {
          past.push(r);
      } else {
          active.push(r);
      }
    }
    return { 
        activeRequests: active.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), 
        pastRequests: past.sort((a,b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0)) 
    };
  }, [requests]);

  // 7. Download Memo PDF
  const handleDownloadMemo = () => {
    if (!viewingRequest) return;
    const content = getIframeContent(viewingRequest);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = viewingRequest.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `Memo-${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 8. Share Action
  const handleShareAction = async (phone: string, request: AnyReq) => {
    setIsSharing(true);
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px'; 
    tempDiv.innerHTML = getPdfContent(request);
    document.body.appendChild(tempDiv);

    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      await doc.html(tempDiv, {
        callback: async function (pdf) {
          try {
            const blob = pdf.output('blob');
            const safeTitle = request.title.replace(/[^a-z0-9]/gi, '_');
            const file = new File([blob], `${safeTitle}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: request.title,
                text: `Hi, I sent you a memo on SAPS. Kindly go check it out.\n\n${request.title}`
              });
              toast.success("Opening Share Sheet...");
            } else {
              pdf.save(`${safeTitle}.pdf`);
              const message = `Hi, I sent you a memo on SAPS: *${request.title}*. \n\n(I have downloaded the PDF file to your device, kindly attach it here.)`;
              const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
              toast.info("PDF Downloaded! Opening WhatsApp...");
              setTimeout(() => { window.open(url, '_blank'); }, 1000);
            }
          } catch (err) {
            console.error("Share failed", err);
            toast.error("Share action cancelled or failed.");
          } finally {
            setIsSharing(false);
            if(document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
          }
        },
        x: 20, y: 20, width: 555, windowWidth: 700
      });
    } catch (e) {
      console.error(e);
      setIsSharing(false);
      if(document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    }
  };

  // ----------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-[#fe0000] h-10 w-10" /></div>;

  return (
    <div className="font-sans">
      <InstructionGuide role="requester" />

      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold text-gray-900">My Requests</h2>
            <span className="h-1 w-16 rounded bg-gradient-to-r from-red-600/60 to-red-600/10 animate-pulse" />
          </div>
          <p className="font-body text-sm text-gray-500 mt-1">Track the approval status of your memos in real-time.</p>
        </div>
        <Button onClick={onNewRequest} className="bg-[#fe0000] hover:bg-[#d50000] text-white shadow-sm shadow-red-200">
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      {/* --- ACTIVE REQUESTS --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-gray-900">Active</h3>
          <span className="text-xs text-gray-500">{activeRequests.length} in progress</span>
        </div>

        {activeRequests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-14 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <p className="font-body text-sm text-gray-600">No active requests.</p>
            <div className="mt-4">
              <Button onClick={onNewRequest} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">Create Request</Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeRequests.map((request) => (
              <div key={request.id}>
                <RequestCard
                  request={request}
                  progress={getProgress(request)}
                  isRequesterView={true}
                  onViewMemo={() => setViewingRequest(request)}
                  onShareMemo={() => openShare(request)}
                  onForwardMemo={() => openForward(request)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- PAST REQUESTS --- */}
      <section className="mt-10 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-gray-900">Past Requests</h3>
          <span className="text-xs text-gray-500">{pastRequests.length} completed</span>
        </div>
        
        {pastRequests.length === 0 ? (
          <div className="text-xs text-gray-500 italic pl-1">No past requests yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pastRequests.map((request) => (
              <div key={request.id} className="relative group">
                 <RequestCard
                    request={request}
                    progress={getProgress(request)}
                    isRequesterView={true}
                    onViewMemo={() => setViewingRequest(request)}
                    onShareMemo={() => openShare(request)}
                    onForwardMemo={() => openForward(request)}
                 />
                 {((request.status === 'paid' || request.status === 'completed' || request.route === 'completed') && !request.purchaseReceiptUrl) && (
                    <div className="mt-[-1rem] mx-4 p-3 bg-red-50 border border-red-100 rounded-b-xl flex justify-between items-center relative z-0 animate-in slide-in-from-top-2">
                       <div className="flex items-center gap-2 text-red-700 text-xs font-bold">
                          <Timer size={14} />
                          <span>Action Required: Upload Receipt</span>
                          <span className="bg-white px-2 py-0.5 rounded text-red-500 border border-red-100 font-mono">
                             {getCountdown(request.paymentDate)}
                          </span>
                       </div>
                       <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs" onClick={() => openConfirmModal(request)}>
                          Confirm Purchase
                       </Button>
                    </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------------------------- */}

      {/* 1. VIEW MEMO MODAL */}
      <FramerPresence>
        {viewingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-50 text-[#fe0000] rounded-lg flex items-center justify-center"><FileText className="h-5 w-5" /></div>
                    <div><h3 className="font-display text-lg font-bold text-gray-900">{viewingRequest.title}</h3><p className="text-xs text-gray-500 font-mono">ID: {viewingRequest.id?.slice(0, 8).toUpperCase()}</p></div>
                </div>
                <button onClick={() => setViewingRequest(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 bg-gray-100 p-0 overflow-hidden relative"><iframe title="Memo Preview" srcDoc={getIframeContent(viewingRequest)} className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts" /></div>
              <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setViewingRequest(null)}>Close</Button>
                  <Button className="bg-[#fe0000] hover:bg-[#d50000] text-white" onClick={handleDownloadMemo}><Download className="mr-2 h-4 w-4" />Download Memo</Button>
              </div>
            </motion.div>
          </div>
        )}
      </FramerPresence>

      {/* 2. FORWARD MODAL (UPDATED WITH RED THEME) */}
      <FramerPresence>
        {forwardOpen && viewingRequest && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold flex items-center gap-2"><CornerUpRight size={18} className="text-gray-400"/> Forward Memo</h3>
                <button onClick={() => setForwardOpen(false)}><X className="h-5 w-5"/></button>
              </div>

              {/* RED INSTRUCTION BOX */}
              <div className="bg-red-50 p-4 border-b border-red-100">
                <div className="flex gap-3">
                    <div className="mt-0.5 text-[#fe0000]"><Info size={18} /></div>
                    <div className="text-sm text-red-900">
                        <p className="font-semibold mb-1">Executive Fast-Track</p>
                        <p className="opacity-90 leading-relaxed">
                            You can forward memo to the executives and if they approve, your memo goes straight to the finance.
                        </p>
                    </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                 {executives.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No executives found.</div>
                 ) : (
                    executives.map((e, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 hover:bg-gray-50 border-b last:border-0 transition-colors">
                           <div className="flex items-center gap-3">
                               <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                   <UserCircle2 size={24} />
                               </div>
                               <div>
                                   <p className="font-bold text-sm text-gray-900">{e.name}</p>
                                   {/* --- RED HIGHLIGHTED POSITION --- */}
                                   <p className="text-xs text-[#fe0000] font-bold uppercase tracking-wide mt-0.5 flex items-center gap-1">
                                      <Briefcase size={10} />
                                      {e.position || 'Executive'}
                                   </p>
                               </div>
                           </div>
                           <Button size="sm" className="bg-gray-900 text-white hover:bg-black" onClick={async () => {
                              await shareMemoToExecutive(viewingRequest, e.uid, e.position);
                              toast.success(`Forwarded to ${e.name}`);
                              setForwardOpen(false);
                           }}>
                               Forward
                           </Button>
                        </div>
                    ))
                 )}
              </div>
            </motion.div>
           </div>
        )}
      </FramerPresence>

      {/* 3. SHARE MODAL */}
      <FramerPresence>
        {shareOpen && shareFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div><h3 className="font-display text-lg font-bold text-gray-900">Share Memo</h3><p className="text-xs text-gray-500">Send PDF via WhatsApp.</p></div>
                <button onClick={() => { setShareOpen(false); setShareFor(null); }} className="p-2 hover:bg-gray-200 rounded-full"><X className="h-5 w-5 text-gray-600" /></button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Memo</p>
                  <p className="text-sm font-medium text-gray-900">{shareFor.title}</p>
                </div>
                
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 mb-2">Contacts</p>
                  <div className="max-h-64 overflow-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
                    {contacts.length === 0 && <div className="p-4 text-sm text-gray-500">No contacts with phone numbers yet.</div>}
                    {contacts.map((c, idx) => (
                      <div key={idx} className="w-full text-left p-3 hover:bg-red-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div><p className="text-sm font-medium text-gray-900">{c.name}</p><p className="text-xs text-gray-500">{c.department}</p></div>
                          <div>
                            <Button
                              className="bg-[#fe0000] hover:bg-[#d50000] text-white gap-2"
                              disabled={isSharing}
                              onClick={() => handleShareAction(c.phone, shareFor)}
                            >
                              {isSharing ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="h-3 w-3" /> Send PDF</>}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </FramerPresence>

      {/* 4. CONFIRM PURCHASE MODAL */}
      <FramerPresence>
        {confirmModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                 <div className="bg-gray-50 p-6 border-b border-gray-100 text-center">
                    <div className="h-12 w-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3">
                       <ShoppingBag size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Confirm Purchase</h3>
                    <p className="text-sm text-gray-500 mt-1">Upload proof that items were bought.</p>
                 </div>
                 
                 <div className="p-6 space-y-4">
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800 text-xs flex items-center gap-2">
                       <Clock size={16} />
                       You have 72 hours from payment to upload this receipt.
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Upload Receipt / Invoice</label>
                       <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 cursor-pointer relative transition-colors">
                          <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setPurchaseReceipt(e.target.files?.[0] || null)} />
                          {purchaseReceipt ? (
                             <div className="flex flex-col items-center text-green-600">
                                <CheckCircle2 size={32} className="mb-2" />
                                <p className="font-bold text-sm">{purchaseReceipt.name}</p>
                             </div>
                          ) : (
                             <div className="flex flex-col items-center text-gray-400">
                                <UploadCloud size={32} className="mb-2" />
                                <p className="text-sm">Click to browse files</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmPurchase} disabled={!purchaseReceipt}>
                       {isUploading ? <Loader2 className="animate-spin" /> : 'Submit Proof'}
                    </Button>
                 </div>
              </motion.div>
           </div>
        )}
      </FramerPresence>

    </div>
  );
}