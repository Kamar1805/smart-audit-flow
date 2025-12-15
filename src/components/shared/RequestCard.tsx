// RequestCard.tsx

import React from 'react'; 
import { motion } from 'framer-motion';
import { Clock, FileText, FileCheck, Eye, Share2, CornerUpRight } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Types for the Progress Bar
interface ProgressData {
  value: number;
  label: string;
  sublabel: string;
  color: string;
  icon?: any;
}

interface RequestCardProps {
  request: any;
  onClick?: () => void;
  onViewMemo?: (e: React.MouseEvent) => void;
  onShareMemo?: (e: React.MouseEvent) => void;
  onForwardMemo?: (e: React.MouseEvent) => void; 
  isRequesterView?: boolean;
  progress?: ProgressData;
}

const formatDate = (dateInput: any) => {
  if (!dateInput) return 'Just now';
  if (typeof dateInput.toDate === 'function') return dateInput.toDate().toLocaleDateString();
  if (dateInput instanceof Date) return dateInput.toLocaleDateString();
  return 'Recent';
};

export function RequestCard({ 
  request, 
  onClick, 
  onViewMemo, 
  onShareMemo, 
  onForwardMemo, 
  isRequesterView = false,
  progress 
}: RequestCardProps) {
  
  // *** FIXED: CHECK FOR 'body' INSTEAD OF 'memo' ***
  const hasMemoContent = 
    (typeof request.body === 'string' && request.body.length > 0) || // Check 'body' (Correct field from memos.ts)
    (typeof request.memo === 'string' && request.memo.length > 0) || // Keep legacy check just in case
    (request.attachments && request.attachments.length > 0);

  const hasMemo = !!hasMemoContent;

  const statusStr = String(request.status || '').toLowerCase();
  const isRejected = statusStr === 'rejected';

  const ProgressIcon = progress?.icon; 

  const handleView = (e: React.MouseEvent) => { e.stopPropagation(); onViewMemo?.(e); };
  const handleShare = (e: React.MouseEvent) => { e.stopPropagation(); onShareMemo?.(e); };
  const handleForward = (e: React.MouseEvent) => { e.stopPropagation(); onForwardMemo?.(e); };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="p-6">
        {/* Top Section */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex gap-4">
            <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center shadow-sm ${isRejected ? 'bg-red-50 border-red-100 text-red-600' : 'bg-red-50 border-red-100 text-[#fe0000]'}`}>
              {hasMemo ? <FileCheck size={28} /> : <FileText size={28} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{request.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{request.description}</p>
              {request.department && (
                <p className="text-xs text-gray-400 mt-1">Department: <span className="font-semibold text-gray-600">{request.department}</span></p>
              )}
            </div>
          </div>
          
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-50 text-gray-600 border-gray-200">
            {request.status?.replace('_', ' ') || 'PENDING'}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100/50">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Amount</p>
            <p className="font-mono text-lg font-bold text-gray-700">
              <span className="text-gray-400 text-sm mr-1">{request.currency || 'NGN'}</span>
              {(request.price || request.amount || 0).toLocaleString()}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Date</p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <Clock size={14} className="text-gray-400" />
              <span>{formatDate(request.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* --- ACTIONS SECTION --- */}
        <div className="flex items-center gap-2 pt-2">
          
          {hasMemo && onViewMemo && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 gap-2 text-[#fe0000] border-red-100 hover:bg-red-50" 
              onClick={handleView}
            >
              <Eye size={16} /> View Memo
            </Button>
          )}
          
          {isRequesterView && hasMemo && (
            <>
              {onShareMemo && (
                <Button 
                  size="sm" 
                  className="h-9 gap-2 bg-green-600 hover:bg-green-700 text-white border-none shadow-sm" 
                  onClick={handleShare}
                >
                  <Share2 size={16} /> Share
                </Button>
              )}
              
              {onForwardMemo && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 gap-2 hover:bg-gray-100" 
                  onClick={handleForward}
                >
                  <CornerUpRight size={16} /> Forward
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {progress && (
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isRejected ? 'text-red-600' : 'text-gray-700'}`}>
              {ProgressIcon && <ProgressIcon size={14} className={isRejected ? 'text-red-600' : 'text-gray-500'} />}
              {progress.label}
            </span>
            <span className="text-xs font-mono text-gray-400">{progress.value}%</span>
          </div>

          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.value}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${progress.color}`}
            />
          </div>
          
          <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
             <span>{progress.sublabel}</span>
             {isRejected && <span className="text-red-600 font-bold">Action Required</span>}
          </div>
        </div>
      )}
    </motion.div>
  );
}