import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import { AppShell, NavigationTab } from './components/layout/AppShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionTable } from './components/transactions/TransactionTable';
import { BudgetsView } from './components/budgets/BudgetsView';
import { PrivacySettings } from './components/settings/PrivacySettings';
import { SignInView } from './components/auth/SignInView';
import { SignUpView } from './components/auth/SignUpView';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading FinPilot Security Context...
        </span>
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return <SignUpView onSwitchToSignIn={() => setAuthView('signin')} />;
    }
    return <SignInView onSwitchToSignUp={() => setAuthView('signup')} />;
  }

  return (
    <FinancialProvider>
      <AppShell currentTab={currentTab} onSelectTab={setCurrentTab}>
        {currentTab === 'dashboard' && (
          <DashboardView onNavigateToTransactions={() => setCurrentTab('transactions')} />
        )}
        {currentTab === 'transactions' && <TransactionTable />}
        {currentTab === 'budgets' && <BudgetsView />}
        {currentTab === 'privacy' && <PrivacySettings />}
      </AppShell>
    </FinancialProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
