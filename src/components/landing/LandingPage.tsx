import { motion } from 'framer-motion';
import { ArrowRight, Shield, FileCheck, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  const features = [
    {
      icon: Shield,
      title: 'Transparent Process',
      description: 'Every step of procurement is tracked and auditable',
    },
    {
      icon: FileCheck,
      title: 'AI-Powered Compliance',
      description: 'Automated compliance checks and risk assessment',
    },
    {
      icon: BarChart3,
      title: 'Price Verification',
      description: 'Real-time market rate analysis and anomaly detection',
    },
    {
      icon: Users,
      title: 'Role-Based Workflow',
      description: 'Streamlined approvals across departments',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-6 px-8 border-b border-border"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-foreground" />
            <span className="font-display text-xl font-semibold text-foreground">SAPS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#about" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="font-display text-5xl md:text-7xl font-semibold text-foreground leading-tight mb-6">
              Transparency in
              <br />
              <span className="text-muted-foreground">Procurement</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            A smart audit and procurement system that brings clarity, 
            compliance, and efficiency to every purchasing decision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              onClick={onLaunch}
              size="lg"
              className="font-body text-base px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 group"
            >
              Launch System
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 px-8 border-t border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-semibold text-center text-foreground mb-16"
          >
            Built for Modern Organizations
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card p-6 rounded-lg border border-border hover:border-foreground/20 transition-colors"
              >
                <feature.icon className="h-10 w-10 text-foreground mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="font-body text-sm text-muted-foreground">
              Smart Audit & Procurement System
            </span>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            © 2024 SAPS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
