import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcurementRequest } from '@/context/AppContext';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest | null;
  onConfirm: (fileName: string) => void;
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  request,
  onConfirm,
}: PaymentReceiptModalProps) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const handleConfirm = () => {
    if (uploadedFile) {
      onConfirm(uploadedFile);
      setUploadedFile(null);
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
            <h2 className="font-display text-xl font-semibold text-foreground">
              Upload Payment Receipt
            </h2>
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
                Approving payment for:
              </p>
              <p className="font-display font-semibold text-foreground">
                {request.title}
              </p>
              <p className="font-body text-lg font-medium text-foreground mt-1">
                ${(request.price * request.quantity).toLocaleString()}
              </p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors"
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-success" />
                    <span className="font-body text-sm text-foreground">
                      {uploadedFile}
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="font-body text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground mb-2">
                    Drag and drop your receipt here
                  </p>
                  <label className="cursor-pointer">
                    <span className="font-body text-sm text-foreground underline">
                      or click to browse
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.png"
                      onChange={handleFileInput}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose} className="font-body">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!uploadedFile}
              className="font-body bg-success hover:bg-success/90 text-success-foreground"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Payment
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
