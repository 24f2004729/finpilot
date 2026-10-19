import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '@finpilot/shared';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const SignUpView: React.FC<{ onSwitchToSignIn: () => void }> = ({ onSwitchToSignIn }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }
      await register(email, password, fullName, currency);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
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
            Create your isolated financial ledger
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">
              Establish Account
            </h2>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="Alex Morgan"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="alex@finpilot.dev"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <Input
              label="Password (min 8 characters)"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onSwitchToSignIn}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
