import { motion } from 'framer-motion';
import { Bell, Check, AlertTriangle, CreditCard, FileCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function NotificationsView() {
  const { requests } = useApp();

  const notifications = [
    {
      id: '1',
      type: 'success',
      icon: Check,
      title: 'Request Approved',
      message: 'Office Chairs request has been verified by Audit.',
      time: '2 hours ago',
    },
    {
      id: '2',
      type: 'warning',
      icon: AlertTriangle,
      title: 'Price Alert',
      message: 'MacBook Pro ($2,500) flagged for price variance.',
      time: '4 hours ago',
    },
    {
      id: '3',
      type: 'info',
      icon: FileCheck,
      title: 'New Request Submitted',
      message: 'Team Lunch request is pending finance approval.',
      time: '1 day ago',
    },
    {
      id: '4',
      type: 'success',
      icon: CreditCard,
      title: 'Payment Completed',
      message: 'Previous quarter supplies payment has been processed.',
      time: '3 days ago',
    },
  ];

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'error':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">Notifications</h2>
          <span className="h-1 w-16 rounded bg-gradient-to-r from-primary/60 to-primary/10 animate-pulse" />
        </div>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Stay updated on your procurement activities
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconStyles(
                  notification.type
                )}`}
              >
                <notification.icon className="h-5 w-5 transition-transform duration-200 ease-out group-hover:scale-105" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-body font-medium text-foreground">
                  {notification.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground mt-0.5">
                  {notification.message}
                </p>
                <span className="font-body text-xs text-muted-foreground mt-2 inline-block">
                  {notification.time}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 bg-secondary/30 rounded-lg border border-border">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">
            No notifications yet.
          </p>
        </div>
      )}
    </div>
  );
}
