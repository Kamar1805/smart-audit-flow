import { cn } from '@/lib/utils';
import { RequestStatus } from '@/context/AppContext';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  PENDING_PROCUREMENT: {
    label: 'Pending Procurement',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
  PENDING_AUDIT: {
    label: 'Pending Audit',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
  PENDING_FINANCE: {
    label: 'Pending Finance',
    className: 'bg-warning/10 text-warning border border-warning/20',
  },
  PAID: {
    label: 'Paid',
    className: 'bg-success/10 text-success border border-success/20',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive border border-destructive/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11px] sm:text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
