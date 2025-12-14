import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileCheck, BarChart3, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Transparent Process',
      description: 'Every step of procurement is tracked and auditable in real-time.',
    },
    {
      icon: FileCheck,
      title: 'AI-Powered Compliance',
      description: 'Automated compliance checks and risk assessment for every request.',
    },
    {
      icon: BarChart3,
      title: 'Price Verification',
      description: 'Real-time market rate analysis and anomaly detection using AI.',
    },
    {
      icon: Users,
      title: 'Role-Based Workflow',
      description: 'Streamlined approvals across Departments, Procurement, Audit, and Finance.',
    },
  ];

  const workflowSteps = [
    { role: 'Requester', action: 'Submit Request', description: 'Create requests, attach memos, and track status instantly.' },
    { role: 'Procurement', action: 'Verify & Check', description: 'Run AI price anomaly checks and verify vendor details.' },
    { role: 'Audit', action: 'Compliance Review', description: 'Ensure all docs match policy before approving funds.' },
    { role: 'Finance', action: 'Final Approval', description: 'Review budget codes and authorize payment.' },
  ];

  return (
    // Updated selection color to red
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img src="/saps.png" alt="SAPS Logo" className="h-12 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold text-slate-900 leading-none tracking-tight">SAPS</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Smart System</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {/* Updated hover colors to red */}
            <a href="#features" className="text-sm font-medium text-slate-500 hover:text-[#fe0000] transition-colors">Features</a>
            <a href="#workflow" className="text-sm font-medium text-slate-500 hover:text-[#fe0000] transition-colors">How it Works</a>
            <Link to="/login">
              <Button className="font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
        
        {/* Background Gradients (Red tints) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-50 rounded-full blur-3xl opacity-60 -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-orange-50 rounded-full blur-3xl opacity-40 -z-10" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center lg:text-left"
            >
              {/* REMOVED Gemini Badge here */}

              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Procurement with <br className="hidden md:block" />
                {/* Updated gradient to red */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fe0000] to-red-600">
                  Radical Transparency
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                The Smart Audit & Procurement System (SAPS) eliminates fraud, ensures compliance, and speeds up approvals using advanced AI analysis.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/login">
                  {/* Updated button color and shadow to red */}
                  <Button size="lg" className="h-14 px-8 rounded-full text-lg bg-[#fe0000] hover:bg-[#d50000] text-white shadow-lg shadow-red-200 transition-all hover:-translate-y-1">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#workflow">
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all">
                    View Workflow
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Right Column: Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
               {/* Decorative blob behind image */}
               <div className="absolute inset-0 bg-gradient-to-tr from-red-100 to-orange-50 rounded-3xl transform rotate-3 scale-105 blur-xl opacity-50 -z-10" />
               <img 
                 src="/hero.png" 
                 alt="SAPS Dashboard Preview" 
                 className="w-full h-auto object-cover rounded-3xl shadow-2xl border border-slate-100/50 relative z-10"
               />
            </motion.div>
          </div>
        </div>
      </main>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built for Modern Governance
            </h2>
            <p className="text-slate-500 text-lg">
              Stop relying on spreadsheets and emails. Move to a centralized, auditable platform designed for integrity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                // Updated hover border to red
                className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all group"
              >
                {/* Updated icon background and group hover to red */}
                <div className="h-14 w-14 rounded-xl bg-red-50 flex items-center justify-center mb-6 group-hover:bg-[#fe0000] transition-colors">
                  {/* Updated icon color to red */}
                  <feature.icon className="h-7 w-7 text-[#fe0000] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- WORKFLOW SECTION --- */}
      <section id="workflow" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Streamlined Approval Workflow
            </h2>
            <p className="text-slate-500">From request to payment in 4 clear steps.</p>
          </div>

          <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-slate-100 -z-10" />

            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative bg-white pt-8"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-6 shadow-md ring-4 ring-white">
                    {index + 1}
                  </div>
                  {/* Updated hover border to red */}
                  <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100 h-full hover:border-red-200 transition-colors">
                    {/* Updated badge color to red */}
                    <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-[#fe0000] font-bold text-xs uppercase tracking-wider mb-4">
                      {step.role}
                    </span>
                    <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{step.action}</h3>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <img src="/saps.png" alt="SAPS" className="h-8 w-auto opacity-80" />
             <span className="font-display text-white font-bold tracking-tight">SAPS</span>
          </div>
          <p className="text-sm">© 2025 TechZ. Securing the future of procurement.</p>
        </div>
      </footer>
    </div>
  );
}