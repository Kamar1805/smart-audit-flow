import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, FileText, Loader2, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { jsPDF } from "jspdf";
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Logic Helpers
import { generateMemoLetter } from '@/lib/ai';
import { extractMemoFromPDF } from '@/lib/pdfExtract';
import { createMemo } from '@/lib/memos';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewRequestModal({ isOpen, onClose }: NewRequestModalProps) {
  const { addRequest } = useApp();
  const { format } = useCurrency(); // We might use this for display, but local state for form is better
  const { profile } = useAuth();

  // TABS: 'ai' = Fill form manually & generate. 'upload' = Upload PDF to auto-fill.
  const [activeTab, setActiveTab] = useState<'ai' | 'upload'>('ai');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [generatedMemo, setGeneratedMemo] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Consolidated Form Data
  const [formData, setFormData] = useState({
    title: '',          // "Request Title" / Subject
    department: profile?.department || '',
    quantity: 1,
    price: 0,           // Unit Price
    currency: 'NGN' as 'NGN' | 'USD' | 'EUR' | 'GBP',
    description: '',    // Justification
    vendor: '',
  });

  // --- CLEAN TEXT HELPER (Removes weird markdown) ---
  const cleanText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')         // Remove bold
      .replace(/##/g, '')           // Remove headings
      .replace(/[|]/g, '')          // Remove table pipes
      .replace(/^\s*[-:]{3,}\s*$/gm, '') // Remove table dividers
      .trim();
  };

  // --- PDF DOWNLOAD HELPER ---
  const handleDownloadPDF = () => {
    if (!generatedMemo) return;
    const doc = new jsPDF();
    const cleanContent = cleanText(generatedMemo);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(cleanContent, 180);
    doc.text(splitText, 15, 20);
    doc.save(`${formData.title || 'procurement_memo'}.pdf`);
  };

  // --- AI GENERATION LOGIC ---
  const handleGenerateMemo = async () => {
    setIsGenerating(true);
    try {
      if (!formData.title) throw new Error('Title is required');
      
      const aiText = await generateMemoLetter({
        title: formData.title,
        department: formData.department,
        requesterName: profile?.name || 'Staff Member',
        justification: formData.description,
        amount: formData.price * formData.quantity, // Total Cost
        quantity: formData.quantity,
        currency: formData.currency,
        vendor: formData.vendor,
      });

      setGeneratedMemo(cleanText(aiText));
    } catch (err) {
      console.error('AI Gen Error', err);
      // Simple fallback if AI fails
      setGeneratedMemo(`TO: Procurement\nSUBJECT: ${formData.title}\n\nPlease procure ${formData.quantity}x ${formData.title}.\nJustification: ${formData.description}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- PDF UPLOAD & EXTRACTION LOGIC ---
  const processUploadedFile = async (file: File) => {
    if (file.type !== 'application/pdf') return;
    
    setIsExtracting(true);
    setExtractError(null);
    setUploadedFile(file.name);

    try {
      const extracted = await extractMemoFromPDF(file);
      
      // If we got basically nothing, show error
      if (!extracted.subject && !extracted.amount && !extracted.body) {
        throw new Error("Could not read data from PDF");
      }

      // Auto-fill the form with extracted data
      setFormData(prev => ({
        ...prev,
        title: extracted.subject || prev.title,
        description: extracted.body || prev.description,
        price: typeof extracted.amount === 'number' ? extracted.amount : prev.price,
        vendor: extracted.vendor || prev.vendor,
        currency: (extracted.currency as any) || prev.currency,
      }));

      // Switch back to "AI View" so user can see the filled form
      setActiveTab('ai'); 

    } catch (err) {
      console.error("PDF Extract Error", err);
      setExtractError("Could not extract details. Please fill the form manually.");
      setUploadedFile(null); // Reset file if failed
    } finally {
      setIsExtracting(false);
    }
  };

  // --- FINAL SUBMIT (FIXED) ---
  const handleSubmit = async () => {
    try {
      const totalCost = formData.price * formData.quantity;
      
      // 1. Add to Local App State (Use null, NOT undefined)
      addRequest({
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        price: formData.price,
        status: 'PENDING_PROCUREMENT',
        requester: profile?.name || 'User',
        department: formData.department,
        memo: generatedMemo || null,       
        memoFile: uploadedFile || null,    
      });

      // 2. Add to Firestore
      if (profile?.uid) {
        await createMemo({
          title: formData.title,
          body: generatedMemo || formData.description,
          amount: totalCost,
          currency: formData.currency,
          attachments: uploadedFile ? [{ name: uploadedFile }] : [], 
          requesterId: profile.uid,
          requesterName: profile.name,
          department: formData.department,
          vendor: formData.vendor || null, 
        });
      }

      // 3. SUCCESS MESSAGE
      // If you have a toast component, use: toast.success("Request submitted successfully!");
      alert("✅ Request successfully submitted to Procurement!"); 

      // Reset & Close
      setGeneratedMemo(null);
      setUploadedFile(null);
      onClose();

    } catch (error) {
      console.error("Submit failed", error);
      alert("❌ Failed to submit request. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* 1. TOP HEADER & TABS */}
          <div className="bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="text-lg font-semibold text-gray-800">New Request</h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            
            {/* TAB SWITCHER */}
            <div className="flex px-4 gap-4">
              <button
                onClick={() => setActiveTab('ai')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'ai' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles size={16} />
                AI MEMO GENERATOR
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'upload' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload size={16} />
                MANUAL MEMO UPLOAD
              </button>
            </div>
          </div>

          {/* 2. MAIN CONTENT AREA (Scrollable) */}
          <div className="p-6 overflow-y-auto flex-1">
            
            {/* --- MANUAL UPLOAD VIEW --- */}
            {activeTab === 'upload' && (
              <div className="flex flex-col items-center justify-center h-full py-8 animate-in fade-in zoom-in-95 duration-200">
                 <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 w-full text-center hover:bg-gray-50 transition-colors relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && processUploadedFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {isExtracting ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-sm text-gray-600">Scanning PDF for details...</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 p-4 rounded-full inline-flex mb-4">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Click to Upload Memo PDF</h3>
                        <p className="text-xs text-gray-500 mt-1">We will extract the details automatically.</p>
                      </>
                    )}
                 </div>
                 {extractError && (
                   <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                     <AlertCircle size={16} />
                     {extractError}
                   </div>
                 )}
              </div>
            )}

            {/* --- AI GENERATOR / FORM VIEW --- */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Section: Core Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Request Title</label>
                    <Input 
                      placeholder="e.g. MacBook Pro for New Interns" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {/* Unit Price */}
                     <div className="md:col-span-1">
                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Est. Price</label>
                       <div className="flex">
                         <select 
                           className="bg-gray-50 border border-gray-200 rounded-l-md px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                           value={formData.currency}
                           onChange={e => setFormData({...formData, currency: e.target.value as any})}
                         >
                           <option>NGN</option>
                           <option>USD</option>
                           <option>EUR</option>
                           <option>GBP</option>
                         </select>
                         <Input 
                           type="number" 
                           placeholder="0.00"
                           className="rounded-l-none"
                           value={formData.price || ''}
                           onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                         />
                       </div>
                     </div>

                     {/* Quantity */}
                     <div>
                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quantity</label>
                       <Input 
                         type="number" 
                         min="1"
                         value={formData.quantity}
                         onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                       />
                     </div>

                     {/* Total Calculation Display (Read Only) */}
                     <div>
                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Cost</label>
                       <div className="h-10 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-mono text-sm">
                         {formData.currency} {(formData.price * formData.quantity).toLocaleString()}
                       </div>
                     </div>
                  </div>

                  {/* Justification */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Justification</label>
                    <Textarea 
                      placeholder="Please tell us why you need this item..." 
                      className="resize-none min-h-[80px]"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <Button 
                    onClick={handleGenerateMemo}
                    disabled={isGenerating || !formData.title}
                    variant="secondary"
                    className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                  >
                    {isGenerating ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    {generatedMemo ? 'Regenerate Memo' : 'Generate Formal Memo with AI'}
                  </Button>
                </div>

                {/* --- MEMO PREVIEW --- */}
                {generatedMemo && (
                  <motion.div 
                    initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}}
                    className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-500 uppercase">Memo Preview</span>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={handleDownloadPDF}>
                        <Download size={14} className="mr-1"/> Download PDF
                      </Button>
                    </div>
                    <div className="p-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                        {cleanText(generatedMemo)}
                      </pre>
                    </div>
                  </motion.div>
                )}

              </div>
            )}
          </div>

          {/* 3. FOOTER ACTIONS */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.title}
              className="bg-[#fe0000] hover:bg-[#d50000] text-white"
            >
              Submit Request
            </Button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}