import { motion } from 'framer-motion';
import { Calendar, User, Building2, DollarSign, FileText } from 'lucide-react';
import { ProcurementRequest } from '@/context/AppContext';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

interface RequestCardProps {
  request: ProcurementRequest;
  onClick?: () => void;
  actions?: React.ReactNode;
  showDetails?: boolean;
  className?: string;
}

export function RequestCard({
  request,
  onClick,
  actions,
  showDetails = false,
  className,
}: RequestCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'bg-card border border-border rounded-lg p-5 hover:border-foreground/20 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display text-lg font-semibold text-foreground truncate">
              {request.title}
            </h3>
            <StatusBadge status={request.status} />
          </div>

          <p className="font-body text-sm text-muted-foreground mb-3 line-clamp-2">
            {request.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-body font-medium text-foreground">
                ${request.price.toLocaleString()}
              </span>
              {request.quantity > 1 && (
                <span className="text-muted-foreground">× {request.quantity}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-body">{request.requester}</span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="font-body">{request.department}</span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-body">
                {request.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>

          {showDetails && request.memo && (
            <div className="mt-4 p-4 bg-card border border-border rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent-red/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-accent-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-sm font-medium text-foreground">
                      Justification_Memo.pdf
                    </span>
                    <span className="font-body text-xs text-muted-foreground">
                      {request.memoFile ? request.memoFile : 'AI Generated'}
                    </span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground line-clamp-2">
                    {request.memo}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showDetails && request.paymentReceipt && (
            <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-success" />
                <span className="font-body text-sm text-success">
                  Receipt: {request.paymentReceipt}
                </span>
              </div>
            </div>
          )}

          {showDetails && request.rejectionReason && (
            <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <span className="font-body text-sm text-destructive">
                Rejection Reason: {request.rejectionReason}
              </span>
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </motion.div>
  );
}
