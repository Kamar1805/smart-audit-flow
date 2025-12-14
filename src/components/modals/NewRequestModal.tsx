import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Loader2, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import { jsPDF } from "jspdf";
import { useAuth } from '@/context/AuthContext';
import { createMemo } from '@/lib/memos';
import { generateMemoHTML } from '@/lib/memoTemplate'; 
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';

// --- AI CONFIG ---
const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// *** FIX: Use correct model name ***
const MODEL_NAME = 'gemini-flash-latest'; 

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to format currency
const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency }).format(amount);
};

// *** FIX: Robust JSON cleaner to prevent syntax errors ***
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export function NewRequestModal({ isOpen, onClose }: NewRequestModalProps) {
  const { addRequest } = useApp();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'ai' | 'upload'>('ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null); 

  // --- FORM DATA STATE ---
  const [formData, setFormData] = useState({
    to: 'GMD',              
    title: '',              
    department: profile?.department || '',
    currency: 'NGN' as 'NGN' | 'USD' | 'EUR' | 'GBP',
    description: '',        
    vendor: '',
    items: [                
      { desc: '', quantity: 1, price: 0 }
    ]
  });

  // Calculate Total on the fly
  const totalCost = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- ITEM HANDLERS ---
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { desc: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleItemChange = (index: number, field: 'desc' | 'quantity' | 'price', value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // --- 1. AI GENERATION LOGIC ---
  const handleGenerateMemo = async () => {
    // Basic Validation
    if (!formData.title || formData.items.some(i => !i.desc || !i.price)) {
      toast.error("Please fill in the Subject and all Item details.");
      return;
    }
    
    // Prevent double clicks
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      const itemsListText = formData.items.map(i => `- ${i.quantity}x ${i.desc} @ ${i.price}`).join('\n');

      const prompt = `
        Act as a professional procurement officer. 
        I need to generate a formal internal memo for a request.
        
        Details:
        - To: ${formData.to}
        - Subject: ${formData.title}
        - Department: ${formData.department}
        - Items Requested:
        ${itemsListText}
        - Total Cost: ${formData.currency} ${totalCost}
        - User Context: ${formData.description}
        
        Please generate the content for these 3 specific sections of a formal memo:
        1. "Background": A brief context of why these items are needed.
        2. "Justification": A persuasive argument for efficiency/productivity/security.
        3. "Prayer": A formal closing request stating exactly what is being asked for (include the total amount in words).
        
        Output ONLY valid JSON format like this:
        {
          "background": "...",
          "justification": "...",
          "prayer": "..."
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // *** FIX: Clean the JSON string before parsing ***
      const jsonStr = cleanJson(text);
      
      const aiData = JSON.parse(jsonStr);

      // GENERATE HTML
      const memoData = {
        to: formData.to, 
        from: formData.department || "Staff", 
        through: "Procurement Department",
        attention: "Audit and Internal Control",
        subject: formData.title,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        background: aiData.background,
        justification: aiData.justification,
        prayer: aiData.prayer,
        items: formData.items.map(i => ({
          desc: i.desc,
          price: Number(i.price),
          qty: Number(i.quantity),
          amount: Number(i.price) * Number(i.quantity)
        })),
        total: totalCost,
        currency: formData.currency
      };

      const finalHtml = generateMemoHTML(memoData);
      setGeneratedHtml(finalHtml); 
      toast.success("Memo generated successfully!");

    } catch (err: any) {
      console.error('AI Gen Error', err);
      
      // *** ROBUST ERROR HANDLING ***
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        toast.error("AI Rate Limit Reached. Please wait 30 seconds.", { duration: 5000 });
      } else if (err instanceof SyntaxError) {
        toast.error("AI returned invalid format. Retrying...", { duration: 3000 });
      } else {
        toast.error("Failed to generate memo. Please try again.", { duration: 4000 });
      }

    } finally {
      setIsGenerating(false);
    }
  };

  // --- 2. DOWNLOAD PDF ---
  const handleDownloadPDF = () => {
    if (!generatedHtml) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generatedHtml;
    document.body.appendChild(tempDiv);

    const doc = new jsPDF('p', 'pt', 'a4');
    doc.html(tempDiv.firstChild as HTMLElement, {
      callback: function (pdf) {
        pdf.save(`${formData.title.replace(/\s+/g, '_')}_Memo.pdf`);
        document.body.removeChild(tempDiv);
      },
      x: 10, y: 10, width: 575, windowWidth: 800
    });
  };

  // --- 3. FINAL SUBMIT ---
  const handleSubmit = async () => {
    try {
      if (!formData.title || totalCost <= 0) {
        toast.error("Please complete the form first.");
        return;
      }

      addRequest({
        title: formData.title,
        description: formData.description,
        quantity: formData.items.length,
        price: totalCost,
        status: 'PENDING_PROCUREMENT',
        requester: profile?.name || 'User',
        department: formData.department,
        memo: generatedHtml || null,
        memoFile: uploadedFile || null,
      });

      if (profile?.uid) {
        await createMemo({
          title: formData.title,
          body: generatedHtml || formData.description,
          amount: totalCost,
          currency: formData.currency,
          attachments: uploadedFile ? [{ name: uploadedFile }] : [], 
          requesterId: profile.uid,
          requesterName: profile.name,
          department: formData.department,
          vendor: formData.vendor || null, 
        });
      }

      toast.success('Request submitted successfully', { duration: 3500 });
      onClose();

    } catch (error) {
      console.error("Submit failed", error);
      toast.error('Failed to submit request', { duration: 4000 });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-100"
          onClick={e => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Procurement Request</h2>
              <p className="text-gray-500 text-sm mt-0.5">Fill in the details to generate your memo</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-[#fe0000] transition-colors">
              <X size={24}/>
            </button>
          </div>

          {/* TABS */}
          <div className="px-6 border-b border-gray-100 flex gap-8">
            <button 
              onClick={() => setActiveTab('ai')} 
              className={`pb-4 text-sm font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'border-[#fe0000] text-[#fe0000]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              <Sparkles size={18} /> AI MEMO GENERATOR
            </button>
            <button 
              onClick={() => setActiveTab('upload')} 
              className={`pb-4 text-sm font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${activeTab === 'upload' ? 'border-[#fe0000] text-[#fe0000]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              <Upload size={18} /> UPLOAD EXISTING PDF
            </button>
          </div>

          {/* CONTENT AREA */}
          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
            
            {/* --- UPLOAD TAB --- */}
            {activeTab === 'upload' && (
              <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:bg-gray-50 transition-colors">
                 <input type="file" accept=".pdf" className="hidden" id="pdf-upload" />
                 <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-[#fe0000]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Upload Memo PDF</h3>
                    <p className="text-gray-500 text-sm mt-2 max-w-xs text-center">Drag and drop your signed memo here or click to browse</p>
                 </label>
              </div>
            )}

            {/* --- AI FORM TAB --- */}
            {activeTab === 'ai' && (
              <div className="space-y-8">
                
                {/* 1. Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Memo To</label>
                    <Input 
                      placeholder="e.g. GMD, Managing Director" 
                      className="h-12 border-gray-200 focus:border-[#fe0000] focus:ring-[#fe0000] bg-white text-base"
                      value={formData.to} 
                      onChange={e => setFormData({...formData, to: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject / Title</label>
                    <Input 
                      placeholder="e.g. Purchase of IT Equipment" 
                      className="h-12 border-gray-200 focus:border-[#fe0000] focus:ring-[#fe0000] bg-white text-base"
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>
                </div>

                {/* 2. Items List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items Requested</label>
                      <span className="text-xs font-medium text-gray-400">Total: {formatMoney(totalCost, formData.currency)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-4">
                        <div className="flex-1">
                          <Input 
                            placeholder="Item Description" 
                            className="h-12 bg-white"
                            value={item.desc}
                            onChange={e => handleItemChange(index, 'desc', e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Qty" 
                            className="h-12 bg-white text-center"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-32">
                          <Input 
                            type="number" 
                            placeholder="Price" 
                            className="h-12 bg-white text-right"
                            value={item.price || ''}
                            onChange={e => handleItemChange(index, 'price', Number(e.target.value))}
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <button 
                            onClick={() => handleRemoveItem(index)}
                            className="h-12 w-12 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handleAddItem}
                    className="w-full border-dashed border-gray-300 text-gray-500 hover:border-[#fe0000] hover:text-[#fe0000] hover:bg-red-50 h-12"
                  >
                    <Plus size={16} className="mr-2" /> Add Another Item
                  </Button>
                </div>

                {/* 3. Justification */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Why is this needed?</label>
                  <Textarea 
                    placeholder="Provide a brief context for the AI to write your justification..." 
                    className="min-h-[100px] resize-none border-gray-200 focus:border-[#fe0000] focus:ring-[#fe0000] bg-white text-base p-4"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                
                {/* Generate Button */}
                <div className="pt-2">
                  <Button 
                    onClick={handleGenerateMemo} 
                    disabled={isGenerating} 
                    className="w-full h-14 bg-gray-900 hover:bg-black text-white text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    {isGenerating ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2 fill-yellow-400 text-yellow-400"/>}
                    {generatedHtml ? 'Regenerate Memo Content' : 'Generate Formal Memo with AI'}
                  </Button>
                </div>

                {/* MEMO PREVIEW */}
                {generatedHtml && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-bold text-gray-700 uppercase">Preview Ready</span>
                      </div>
                      <Button size="sm" variant="outline" className="h-9 gap-2 text-[#fe0000] border-red-100 hover:bg-red-50" onClick={handleDownloadPDF}>
                        <Download size={16}/> Download PDF
                      </Button>
                    </div>
                    {/* Render HTML Safely */}
                    <div className="p-8 bg-gray-100/50 overflow-auto max-h-[400px]">
                        <div className="bg-white shadow-sm p-2 mx-auto max-w-[600px] origin-top scale-[0.8]">
                          <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                        </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-4 z-10 sticky bottom-0">
            <Button variant="ghost" onClick={onClose} className="h-12 px-6 text-gray-500 hover:text-gray-900">Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!generatedHtml && !uploadedFile} 
              className="h-12 px-8 bg-[#fe0000] hover:bg-[#d50000] text-white font-bold text-base shadow-lg shadow-red-200 transition-transform hover:-translate-y-1"
            >
              Submit Final Request
            </Button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}