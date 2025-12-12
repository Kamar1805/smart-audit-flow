import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, mockCredentials } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = login(email, password);
    setIsLoading(false);

    if (result.success) {
      const credentials = mockCredentials[email.toLowerCase()];
      toast({
        title: 'Login successful',
        description: `Welcome back, ${credentials.name}!`,
      });
      
      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        requester: '/requester',
        procurement: '/procurement',
        audit: '/audit',
        finance: '/finance',
      };
      navigate(roleRoutes[credentials.role]);
    } else {
      toast({
        title: 'Login failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const credentialsList = [
    { role: 'Head of Department', email: 'requester@saps.com', password: 'requester123' },
    { role: 'Procurement Officer', email: 'procurement@saps.com', password: 'procurement123' },
    { role: 'Internal Audit', email: 'audit@saps.com', password: 'audit123' },
    { role: 'Finance Approver', email: 'finance@saps.com', password: 'finance123' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <Shield className="h-8 w-8 text-foreground" />
            <span className="font-display text-xl font-semibold text-foreground">SAPS</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="font-body text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-body"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="font-body pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-body"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials Toggle */}
          <div className="mt-8">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full flex items-center justify-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="h-4 w-4" />
              {showCredentials ? 'Hide' : 'Show'} demo credentials
            </button>

            {showCredentials && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-secondary rounded-lg border border-border"
              >
                <p className="font-body text-xs text-muted-foreground mb-3 text-center">
                  Click on a role to auto-fill credentials
                </p>
                <div className="space-y-2">
                  {credentialsList.map((cred) => (
                    <button
                      key={cred.email}
                      onClick={() => {
                        setEmail(cred.email);
                        setPassword(cred.password);
                      }}
                      className="w-full text-left p-3 rounded-md bg-background hover:bg-accent transition-colors border border-border"
                    >
                      <p className="font-body text-sm font-medium text-foreground">{cred.role}</p>
                      <p className="font-body text-xs text-muted-foreground">{cred.email}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
