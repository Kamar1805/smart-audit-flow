import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flag, ChevronDown, ChevronUp, Shield, FileCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InstructionGuide } from '@/components/shared/InstructionGuide';
import { RequestCard } from '@/components/shared/RequestCard';
import { RejectionModal } from '@/components/modals/RejectionModal';
import { useApp, ProcurementRequest } from '@/context/AppContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// duplicate import removed
import { useStorage } from '@/hooks/useStorage';
import { useToast } from '@/components/ui/use-toast';

export function AuditDashboard() {
  const { getRequestsByStatus, updateRequest } = useApp();
  const { format } = useCurrency();
  const [quickPolicy, setQuickPolicy] = useState('');
  const [quickAmount, setQuickAmount] = useState<number | ''>('');
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const { uploadFile, uploading, error } = useStorage();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [flagRequest, setFlagRequest] = useState<ProcurementRequest | null>(null);

  const pendingRequests = getRequestsByStatus('PENDING_AUDIT');
  const approvedRequests = getRequestsByStatus('PAID');

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
      {/* Policy Upload for AI Reference */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <h3 className="font-display text-lg font-semibold mb-3">Upload Compliance Policy (PDF)</h3>
        <p className="font-body text-sm text-muted-foreground mb-3">Store policy documents for AI reference across items.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="font-body text-sm">Policy Title</Label>
            <Input value={quickPolicy} onChange={(e) => setQuickPolicy(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="font-body text-sm">Policy PDF</Label>
            <Input type="file" accept="application/pdf" className="mt-1" onChange={(e) => setPolicyFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="mt-3 flex gap-3">
          <Button size="sm" className="font-body" disabled={!policyFile || uploading} onClick={async () => {
            if (!policyFile) return;
            const url = await uploadFile(policyFile, 'policies');
            // TODO: persist URL to backend/db via API
            console.log('Uploaded policy URL:', url);
            if (url) {
              toast({ title: 'Policy uploaded', description: 'Your policy PDF is stored for AI reference.' });
            } else if (error) {
              toast({ title: 'Upload failed', description: error, variant: 'destructive' });
            }
          }}>Upload</Button>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>

      {/* Quick Request */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <h3 className="font-display text-lg font-semibold mb-3">Quick Request</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="font-body text-sm">Policy Reference</Label>
            <Input value={quickPolicy} onChange={(e) => setQuickPolicy(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="font-body text-sm">Amount</Label>
            <Input
              type="number"
              value={quickAmount as any}
              onChange={(e) => setQuickAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="Amount"
              className="mt-1"
            />
            {quickAmount !== '' && (
              <p className="text-xs text-muted-foreground mt-1">{format(Number(quickAmount))}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button size="sm" className="font-body">Open Full Request</Button>
          <Button size="sm" variant="outline" className="font-body">Save Draft</Button>
        </div>
      </div>

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
                    <div className="p-3 bg-secondary/50 rounded-lg text-center">
                      <p className="font-body text-xs text-muted-foreground">Total Amount</p>
                      <p className="font-display text-xl font-semibold text-foreground">{format(request.price * request.quantity)}</p>
                    </div>
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
                        className="font-body transition-transform duration-200 ease-out hover:-translate-y-[1px]"
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
                        className="font-body bg-success hover:bg-success/90 text-success-foreground transition-transform duration-200 ease-out hover:-translate-y-[1px]"
                      >
                        <Check className="mr-1.5 h-4 w-4" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFlagRequest(request)}
                        className="font-body text-warning hover:bg-warning hover:text-warning-foreground transition-transform duration-200 ease-out hover:-translate-y-[1px]"
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

      {/* Past Approvals */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Past Approvals</h3>
        {approvedRequests.length === 0 ? (
          <div className="text-sm text-muted-foreground">No approvals yet.</div>
        ) : (
          <div className="space-y-3">
            {approvedRequests.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>

      <RejectionModal
        isOpen={!!flagRequest}
        onClose={() => setFlagRequest(null)}
        request={flagRequest}
        onConfirm={handleFlag}
      />
    </div>
  );
}
