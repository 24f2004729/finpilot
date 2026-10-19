import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Sparkles, ShieldCheck, ArrowRight, PlayCircle } from 'lucide-react';

export const SignInView: React.FC<{ onSwitchToSignUp: () => void }> = ({ onSwitchToSignUp }) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('alex@finpilot.dev');
  const [password, setPassword] = useState('DemoPilot2026!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemo() {
    setErrorMsg(null);
    setIsDemoLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start demo session.');
    } finally {
      setIsDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500/20 selection:text-emerald-300">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-slate-950 font-bold shadow-xl shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">FinPilot</h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Institutional-Grade Personal Finance & Cash Flow Intelligence
          </p>
        </div>

        {/* 1-Click Demo Showcase Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Instant Portfolio Preview
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Explore pre-seeded deterministic financial ledgers, budget targets, and cash flow intelligence with zero sign-up required.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-3.5 w-full flex items-center justify-center gap-2"
                onClick={handleDemo}
                isLoading={isDemoLoading}
              >
                Launch Live Demo Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Standard Sign In Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">
              Sign In to Your Workspace
            </h2>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="alex@finpilot.dev"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="secondary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In with Credentials
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onSwitchToSignUp}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Need a new workspace? Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
