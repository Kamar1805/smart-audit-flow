import { motion } from 'framer-motion';
import { User, Bell, Shield, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function SettingsView() {
  const settingsSections = [
    {
      title: 'Profile Settings',
      icon: User,
      items: [
        { label: 'Display Name', value: 'John Doe', type: 'text' },
        { label: 'Email', value: 'john.doe@company.com', type: 'text' },
        { label: 'Department', value: 'Engineering', type: 'text' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Email notifications', value: true, type: 'toggle' },
        { label: 'Request updates', value: true, type: 'toggle' },
        { label: 'Weekly digest', value: false, type: 'toggle' },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        { label: 'Two-factor authentication', value: true, type: 'toggle' },
        { label: 'Session timeout (minutes)', value: '30', type: 'text' },
      ],
    },
    {
      title: 'Preferences',
      icon: Globe,
      items: [
        { label: 'Language', value: 'English', type: 'text' },
        { label: 'Currency', value: 'USD', type: 'text' },
        { label: 'Compact view', value: false, type: 'toggle' },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">Settings</h2>
          <span className="h-1 w-16 rounded bg-gradient-to-r from-primary/60 to-primary/10 animate-pulse" />
        </div>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      <div className="grid gap-6">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30">
              <section.icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-display font-semibold text-foreground">
                {section.title}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4"
                >
                  <span className="font-body text-sm text-foreground">
                    {item.label}
                  </span>
                  {item.type === 'toggle' ? (
                    <Switch defaultChecked={item.value as boolean} />
                  ) : (
                    <span className="font-body text-sm text-muted-foreground">
                      {item.value as string}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
