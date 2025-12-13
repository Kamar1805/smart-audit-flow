import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, FileCheck, BarChart3, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingPage() {
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

  const workflowSteps = [
    { role: 'Requester', action: 'Submit + Track', description: 'Create requests, attach memo, track status with progress bar' },
    { role: 'Procurement', action: 'Verify + Vendors', description: 'Confirm need, run price anomaly checks, and find vendors' },
    { role: 'Audit', action: 'Compliance + Policy', description: 'Upload policy PDFs, run compliance analysis, flag issues' },
    { role: 'Finance', action: 'Budget + Payment', description: 'Review budget utilization, approve/hold/reject and attach receipts' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-foreground" />
            <span className="font-display text-xl font-semibold text-foreground">SAPS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Workflow
            </a>
            <Link to="/login">
              <Button variant="outline" className="font-body">
                Sign In
              </Button>
            </Link>
          </nav>
          <Link to="/login" className="md:hidden">
            <Button variant="outline" size="sm" className="font-body">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          {/* Gradient Accent */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background/70" />
          
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-20 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Removed trusted by government agencies badge */}

              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] mb-6 text-foreground">
                Modern, Transparent
                <br />
                <span className="text-muted-foreground">Approval & Procurement</span>
              </h1>

              <p className="font-body text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                A smart audit and procurement system that brings clarity, 
                compliance, and efficiency to every purchasing decision.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              >
                <Link to="/login">
                  <Button size="lg" className="font-body text-base px-8 py-6 group transition-transform duration-300 ease-out hover:translate-y-[-1px]">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#workflow">
                  <Button variant="outline" size="lg" className="font-body text-base px-8 py-6 transition-transform duration-300 ease-out hover:translate-y-[-1px]">
                    See How It Works
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            {/* Removed noisy stats section per request */}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-8 bg-secondary/50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                Built for Modern Organizations
              </h2>
              <p className="font-body text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage procurement with transparency and efficiency
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-card p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
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

        {/* Workflow Section */}
        <section id="workflow" className="py-24 px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                Streamlined Approval Workflow
              </h2>
              <p className="font-body text-muted-foreground max-w-2xl mx-auto">
                Each role has a dedicated dashboard with clear responsibilities across Requester, Procurement, Audit, and Finance.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border">
                <span className="font-body text-xs text-muted-foreground">Powered by Google Generative AI</span>
              </div>
            </motion.div>

            <div className="relative">
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {workflowSteps.map((step, index) => (
                  <motion.div
                    key={step.role}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    className="relative"
                  >
                    {/* Step Number */}
                    <div className="hidden lg:flex absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-foreground text-background items-center justify-center text-xs font-body font-medium z-10">
                      {index + 1}
                    </div>
                    
                    <div className="bg-card p-6 rounded-xl border border-border text-center lg:mt-6">
                      <span className="inline-block px-3 py-1 rounded-full bg-secondary text-foreground font-body text-xs font-medium mb-3">
                        {step.role}
                      </span>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                        {step.action}
                      </h3>
                      <p className="font-body text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-center mt-12"
            >
              {/* Removed demo button per request */}
            </motion.div>
          </div>
        </section>
      </main>

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
            © 2025 TechZ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
