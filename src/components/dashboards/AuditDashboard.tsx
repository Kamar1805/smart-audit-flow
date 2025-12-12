import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flag, ChevronDown, ChevronUp, Shield, FileCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InstructionGuide } from '@/components/shared/InstructionGuide';
import { RequestCard } from '@/components/shared/RequestCard';
import { RejectionModal } from '@/components/modals/RejectionModal';
import { useApp, ProcurementRequest } from '@/context/AppContext';

export function AuditDashboard() {
  const { getRequestsByStatus, updateRequest } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flagRequest, setFlagRequest] = useState<ProcurementRequest | null>(null);

  const pendingRequests = getRequestsByStatus('PENDING_AUDIT');

  const handleVerify = (request: ProcurementRequest) => {
    updateRequest(request.id, {
      status: 'PENDING_FINANCE',
    });
  };

  const handleFlag = (reason: string) => {
    if (flagRequest) {
      updateRequest(flagRequest.id, {
        status: 'REJECTED',
        rejectionReason: `Flagged by Audit: ${reason}`,
      });
    }
  };

  const ComplianceScore = ({ score }: { score: number }) => {
    const getScoreColor = () => {
      if (score >= 90) return 'text-success';
      if (score >= 70) return 'text-warning';
      return 'text-destructive';
    };

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Progress value={score} className="h-2" />
        </div>
        <span className={`font-body font-semibold text-sm ${getScoreColor()}`}>
          {score}/100
        </span>
      </div>
    );
  };

  const AIAnalysisPanel = ({ request }: { request: ProcurementRequest }) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 p-4 bg-secondary/50 rounded-lg border border-border"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">
          AI Compliance Analysis
        </span>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-success" />
            <span className="font-body text-sm text-foreground">Budget Code</span>
          </div>
          <span className="font-body text-sm font-medium text-success">
            {request.aiAnalysis?.budgetCode || 'Valid'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            <span className="font-body text-sm text-foreground">Vendor Status</span>
          </div>
          <span className="font-body text-sm font-medium text-success">
            {request.aiAnalysis?.vendorStatus || 'Verified'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-card rounded border border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="font-body text-sm text-foreground">Risk Level</span>
          </div>
          <span
            className={`font-body text-sm font-medium ${
              request.aiAnalysis?.riskLevel === 'Low'
                ? 'text-success'
                : request.aiAnalysis?.riskLevel === 'Medium'
                ? 'text-warning'
                : 'text-destructive'
            }`}
          >
            {request.aiAnalysis?.riskLevel || 'Low'}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div>
      <InstructionGuide role="audit" />

      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Pending Audit Review
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Verify compliance and review AI analysis for each request
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-secondary/30 rounded-lg border border-border"
        >
          <p className="font-body text-muted-foreground">
            No pending audit requests.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div key={request.id}>
              <RequestCard
                request={request}
                showDetails
                actions={
                  <div className="flex flex-col gap-3">
                    <div className="w-48">
                      <p className="font-body text-xs text-muted-foreground mb-1.5">
                        Compliance Score
                      </p>
                      <ComplianceScore score={request.complianceScore || 85} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedId(expandedId === request.id ? null : request.id)
                        }
                        className="font-body"
                      >
                        {expandedId === request.id ? (
                          <>
                            <ChevronUp className="mr-1.5 h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1.5 h-4 w-4" />
                            Details
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleVerify(request)}
                        className="font-body bg-success hover:bg-success/90 text-success-foreground"
                      >
                        <Check className="mr-1.5 h-4 w-4" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFlagRequest(request)}
                        className="font-body text-warning hover:bg-warning hover:text-warning-foreground"
                      >
                        <Flag className="mr-1.5 h-4 w-4" />
                        Flag
                      </Button>
                    </div>
                  </div>
                }
              />
              <AnimatePresence>
                {expandedId === request.id && <AIAnalysisPanel request={request} />}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      <RejectionModal
        isOpen={!!flagRequest}
        onClose={() => setFlagRequest(null)}
        request={flagRequest}
        onConfirm={handleFlag}
      />
    </div>
  );
}
