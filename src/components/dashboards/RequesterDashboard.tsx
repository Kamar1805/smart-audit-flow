import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstructionGuide } from '@/components/shared/InstructionGuide';
import { RequestCard } from '@/components/shared/RequestCard';
import { useApp } from '@/context/AppContext';

interface RequesterDashboardProps {
  onNewRequest: () => void;
}

export function RequesterDashboard({ onNewRequest }: RequesterDashboardProps) {
  const { getMyRequests } = useApp();
  const requests = getMyRequests();

  return (
    <div>
      <InstructionGuide role="requester" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            My Requests
          </h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Track and manage your procurement requests
          </p>
        </div>
        <Button onClick={onNewRequest} className="font-body">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
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
            <RequestCard key={request.id} request={request} showDetails />
          ))}
        </div>
      )}
    </div>
  );
}
