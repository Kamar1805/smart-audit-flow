import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstructionGuide } from '@/components/shared/InstructionGuide';
import { RequestCard } from '@/components/shared/RequestCard';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface RequesterDashboardProps {
  onNewRequest: () => void;
}

export function RequesterDashboard({ onNewRequest }: RequesterDashboardProps) {
  const { getMyRequests } = useApp();
  const requests = getMyRequests();
  const { format } = useCurrency();
  const [procuringBy, setProcuringBy] = useState<'requester' | 'procurement'>('requester');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState<number | ''>('');
  const [memoProgress, setMemoProgress] = useState(40);

  return (
    <div>
      <InstructionGuide role="requester" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold text-foreground">My Requests</h2>
            <span className="h-1 w-16 rounded bg-gradient-to-r from-primary/60 to-primary/10 animate-pulse" />
          </div>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Track and manage your procurement requests
          </p>
        </div>
        <Button onClick={onNewRequest} className="font-body transition-transform duration-200 ease-out hover:-translate-y-[1px]">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Quick Request removed; use New Request modal only */}

      {/* Memo Progress */}
      <div className="bg-card border border-border rounded-lg p-4 mb-8">
        <h3 className="font-display text-lg font-semibold mb-3 transition-colors">Memo Status</h3>
        <p className="font-body text-sm text-muted-foreground mb-2">Current memo completion</p>
        <Progress value={memoProgress} />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Drafting</span>
          <span className="text-xs text-muted-foreground">{memoProgress}%</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-secondary/30 rounded-lg border border-border"
        >
          <p className="font-body text-muted-foreground mb-4">
            No requests yet. Create your first procurement request.
          </p>
          <Button onClick={onNewRequest} variant="outline" className="font-body">
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} isRequesterView={true} />
          ))}
        </div>
      )}
    </div>
  );
}
