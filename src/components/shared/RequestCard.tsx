import { motion } from 'framer-motion';
import { Clock, FileText, MoreVertical, FileCheck, Eye } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// HELPER: Safely format Firestore Timestamps
const formatDate = (dateInput: any) => {
  if (!dateInput) return 'Just now';
  if (typeof dateInput.toDate === 'function') {
    return dateInput.toDate().toLocaleDateString();
  }
  if (dateInput instanceof Date) {
    return dateInput.toLocaleDateString();
  }
  return 'Recent';
};

interface RequestCardProps {
  request: any;
  onClick?: () => void;
  onViewMemo?: (e: React.MouseEvent) => void; // New prop for direct memo viewing
  isRequesterView?: boolean;
}

export function RequestCard({ request, onClick, onViewMemo, isRequesterView = false }: RequestCardProps) {
  
  const statusColors = {
    PENDING_PROCUREMENT: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-500/10',
    APPROVED: 'bg-green-50 text-green-700 border-green-200 ring-green-500/10',
    REJECTED: 'bg-red-50 text-red-700 border-red-200 ring-red-500/10',
    AUDIT: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10',
  };

  const hasMemo = request.memo || request.memoFile || request.attachments?.length > 0;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Top Section */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex gap-4">
          {/* Bigger Icon */}
          <div className="h-14 w-14 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            {hasMemo ? <FileCheck size={28} /> : <FileText size={28} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{request.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{request.description}</p>
          </div>
        </div>
        
        {/* Status Badge (Top Right) */}
        <Badge 
          variant="outline" 
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ring-1 ${statusColors[request.status as keyof typeof statusColors] || 'bg-gray-50 text-gray-600'}`}
        >
          {request.status?.replace('_', ' ') || 'PENDING'}
        </Badge>
      </div>

      {/* Middle Section: Stats */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100/50">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Amount</p>
          <p className="font-mono text-lg font-bold text-gray-700">
            <span className="text-gray-400 text-sm mr-1">{request.currency || 'NGN'}</span>
            {request.price?.toLocaleString() || request.amount?.toLocaleString()}
          </p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Requested On</p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            <Clock size={14} className="text-gray-400" />
            <span>{formatDate(request.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-2 pt-2">
        <div className="flex items-center gap-2">
           {/* VIEW MEMO BUTTON */}
           {hasMemo && (
             <Button 
               variant="outline" 
               size="sm" 
               className="h-9 gap-2 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-medium transition-colors"
               onClick={(e) => {
                 e.stopPropagation(); // Prevent opening the main card click
                 if (onViewMemo) onViewMemo(e);
               }}
             >
               <Eye size={16} />
               View Memo
             </Button>
           )}
        </div>
        
        {!isRequesterView && (
           <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-700">
             <MoreVertical size={18} />
           </Button>
        )}
      </div>
    </motion.div>
  );
}