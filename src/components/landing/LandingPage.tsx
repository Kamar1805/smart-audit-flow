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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header
        className="py-6 px-8 border-b"
        style={{ borderColor: '#F3F4F6' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" style={{ color: '#111827' }} />
            <span className="font-display text-xl font-semibold" style={{ color: '#111827' }}>SAPS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-body text-sm transition-colors" style={{ color: '#374151' }}>
              Features
            </a>
            <a href="#about" className="font-body text-sm transition-colors" style={{ color: '#374151' }}>
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-tight mb-6" style={{ color: '#111827' }}>
            Transparency in
            <br />
            <span style={{ color: '#6B7280' }}>Procurement</span>
          </h1>

          <p
            className="font-body text-lg md:text-xl max-w-2xl mx-auto mb-12"
            style={{ color: '#374151' }}
          >
            A smart audit and procurement system that brings clarity, 
            compliance, and efficiency to every purchasing decision.
          </p>

          <Button
            onClick={onLaunch}
            size="lg"
            className="font-body text-base px-8 py-6 transition-all duration-300 group"
            style={{ backgroundColor: '#111827', color: '#FFFFFF' }}
          >
            Launch System
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 px-8 border-t" style={{ borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-display text-3xl md:text-4xl font-semibold text-center mb-16"
            style={{ color: '#111827' }}
          >
            Built for Modern Organizations
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-lg border transition-colors"
                style={{ borderColor: '#E5E7EB' }}
              >
                <feature.icon className="h-10 w-10 mb-4" style={{ color: '#111827' }} />
                <h3 className="font-display text-lg font-semibold mb-2" style={{ color: '#111827' }}>
                  {feature.title}
                </h3>
                <p className="font-body text-sm" style={{ color: '#6B7280' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t" style={{ borderColor: '#F3F4F6' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: '#6B7280' }} />
            <span className="font-body text-sm" style={{ color: '#6B7280' }}>
              Smart Audit & Procurement System
            </span>
          </div>
          <p className="font-body text-sm" style={{ color: '#6B7280' }}>
            © 2024 SAPS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
