import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProcurementRequest } from '@/context/AppContext';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest | null;
  onConfirm: (reason: string) => void;
}

export function RejectionModal({
  isOpen,
  onClose,
  request,
  onConfirm,
}: RejectionModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason('');
      onClose();
    }
  };

  if (!isOpen || !request) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Reject Request
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
              <p className="font-body text-sm text-muted-foreground">
                Rejecting:
              </p>
              <p className="font-display font-semibold text-foreground">
                {request.title}
              </p>
            </div>

            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">
                Reason for Rejection <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please provide a clear reason for rejecting this request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="font-body resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="font-body">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!reason.trim()}
              variant="destructive"
              className="font-body"
            >
              Reject Request
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
