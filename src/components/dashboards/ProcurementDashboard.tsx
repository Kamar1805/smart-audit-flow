import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstructionGuide } from '@/components/shared/InstructionGuide';
import { RequestCard } from '@/components/shared/RequestCard';
import { RejectionModal } from '@/components/modals/RejectionModal';
import { useApp, ProcurementRequest } from '@/context/AppContext';

export function ProcurementDashboard() {
  const { getRequestsByStatus, updateRequest } = useApp();
  const [rejectionRequest, setRejectionRequest] = useState<ProcurementRequest | null>(null);
  
  const pendingRequests = getRequestsByStatus('PENDING_PROCUREMENT');

  const handleApprove = (request: ProcurementRequest) => {
    updateRequest(request.id, {
      status: 'PENDING_AUDIT',
      complianceScore: Math.floor(Math.random() * 15) + 85,
      aiAnalysis: {
        budgetCode: 'Valid - OPEX-2025',
        vendorStatus: 'Verified Supplier',
        riskLevel: 'Low',
      },
    });
  };

  const handleReject = (reason: string) => {
    if (rejectionRequest) {
      updateRequest(rejectionRequest.id, {
        status: 'REJECTED',
        rejectionReason: reason,
      });
    }
  };

  return (
    <div>
      <InstructionGuide role="procurement" />

      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Pending Procurement Review
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Verify if requested items are actually needed by the department
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-secondary/30 rounded-lg border border-border"
        >
          <p className="font-body text-muted-foreground">
            No pending procurement requests.
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
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium font-body bg-secondary text-foreground border border-border">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Need Verification Required
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      className="font-body bg-success hover:bg-success/90 text-success-foreground"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Approve Need
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

      <RejectionModal
        isOpen={!!rejectionRequest}
        onClose={() => setRejectionRequest(null)}
        request={rejectionRequest}
        onConfirm={handleReject}
      />
    </div>
  );
}
