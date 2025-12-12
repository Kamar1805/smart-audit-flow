import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstructionGuide } from '@/components/shared/InstructionGuide';
import { RequestCard } from '@/components/shared/RequestCard';
import { PaymentReceiptModal } from '@/components/modals/PaymentReceiptModal';
import { RejectionModal } from '@/components/modals/RejectionModal';
import { useApp, ProcurementRequest } from '@/context/AppContext';

export function FinanceDashboard() {
  const { getRequestsByStatus, updateRequest } = useApp();
  const [paymentRequest, setPaymentRequest] = useState<ProcurementRequest | null>(null);
  const [rejectionRequest, setRejectionRequest] = useState<ProcurementRequest | null>(null);

  const pendingRequests = getRequestsByStatus('PENDING_FINANCE');

  const handlePaymentConfirm = (fileName: string) => {
    if (paymentRequest) {
      updateRequest(paymentRequest.id, {
        status: 'PAID',
        paymentReceipt: fileName,
      });
    }
  };

  const handleReject = (reason: string) => {
    if (rejectionRequest) {
      updateRequest(rejectionRequest.id, {
        status: 'REJECTED',
        rejectionReason: `Rejected by Finance: ${reason}`,
      });
    }
  };

  return (
    <div>
      <InstructionGuide role="finance" />

      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Pending Finance Approval
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Final approval step - upload payment receipts to complete transactions
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-secondary/30 rounded-lg border border-border"
        >
          <p className="font-body text-muted-foreground">
            No pending finance approvals.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              showDetails
              actions={
                <div className="flex flex-col gap-2">
                  <div className="p-3 bg-secondary/50 rounded-lg text-center">
                    <p className="font-body text-xs text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="font-display text-xl font-semibold text-foreground">
                      ${(request.price * request.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setPaymentRequest(request)}
                      className="font-body bg-success hover:bg-success/90 text-success-foreground"
                    >
                      <CreditCard className="mr-1.5 h-4 w-4" />
                      Approve Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectionRequest(request)}
                      className="font-body text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      <PaymentReceiptModal
        isOpen={!!paymentRequest}
        onClose={() => setPaymentRequest(null)}
        request={paymentRequest}
        onConfirm={handlePaymentConfirm}
      />

      <RejectionModal
        isOpen={!!rejectionRequest}
        onClose={() => setRejectionRequest(null)}
        request={rejectionRequest}
        onConfirm={handleReject}
      />
    </div>
  );
}
