import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// --- FIX: USE THE FREE MODEL ---
const MODEL_NAME = 'gemini-flash-latest';

interface PriceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PriceCheckModal({ isOpen, onClose }: PriceCheckModalProps) {
  const [item, setItem] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRunCheck = async () => {
    if (!item || !price) return;
    setLoading(true);
    setResult(null);

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `
        Analyze this price for a "${item}" listed at "${price}".
        Context: Market price in Nigeria.
        Output JSON: {
          "status": "fair" | "high" | "low",
          "message": "Natural language explanation of why.",
          "market_range": "e.g. NGN 40,000 - 50,000"
        }
      `;
      
      const res = await model.generateContent(prompt);
      const jsonStr = res.response.text().replace(/```json|```/g, '').trim();
      setResult(JSON.parse(jsonStr));

    } catch (e) {
      console.error(e);
      alert("Error running check.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }} 
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
         >
           <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50">
             <h2 className="font-display text-lg font-bold text-purple-900 flex items-center gap-2">
               <Sparkles size={18} className="text-purple-600" />
               Instant Price Check
             </h2>
             <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
           </div>
           
           <div className="p-6 space-y-4">
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase">Item Name</label>
               <Input 
                 placeholder="e.g. HP Monitor 24 inch" 
                 value={item} 
                 onChange={e => setItem(e.target.value)} 
                 className="mt-1"
               />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase">Estimated Price</label>
               <Input 
                 placeholder="e.g. NGN 150,000" 
                 value={price} 
                 onChange={e => setPrice(e.target.value)} 
                 className="mt-1"
               />
             </div>

             <Button 
               onClick={handleRunCheck} 
               disabled={loading || !item || !price}
               className="w-full bg-purple-600 hover:bg-purple-700 text-white"
             >
               {loading ? <Loader2 className="animate-spin mr-2" /> : 'Analyze Price'}
             </Button>

             {result && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className={`mt-4 p-4 rounded-xl border ${
                   result.status === 'fair' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                 }`}
               >
                 <div className="flex items-center gap-2 font-bold mb-1">
                   {result.status === 'fair' ? (
                     <CheckCircle2 className="text-green-600" size={18} />
                   ) : (
                     <AlertCircle className="text-red-600" size={18} />
                   )}
                   <span className="capitalize">{result.status} Price</span>
                 </div>
                 <p className="text-sm text-gray-700 leading-snug mb-2">{result.message}</p>
                 <div className="text-xs font-mono bg-white/60 p-2 rounded text-gray-600">
                   Market Range: {result.market_range}
                 </div>
               </motion.div>
             )}
           </div>
         </motion.div>
       </div>
    </AnimatePresence>
  );
}