import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinancial } from '../../context/FinancialContext';
import { formatMonthDisplay } from '@finpilot/shared';
import { Badge } from '../common/Badge';
import {
  LayoutDashboard,
  Receipt,
  Target,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Info,
  Menu,
  X,
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'transactions' | 'budgets' | 'privacy';

export const AppShell: React.FC<{
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  children: React.ReactNode;
}> = ({ currentTab, onSelectTab, children }) => {
  const { user, logout, demoLogin } = useAuth();
  const { selectedMonth, goToPrevMonth, goToNextMonth } = useFinancial();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions' as NavigationTab, label: 'Ledger & Transactions', icon: Receipt },
    { id: 'budgets' as NavigationTab, label: 'Budget Targets', icon: Target },
    { id: 'privacy' as NavigationTab, label: 'Privacy & Data Control', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-full md:h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-100 block">
                FinPilot
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Institutional Cash Flow
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Footer Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate max-w-[140px]">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                {user?.fullName || 'User'}
              </span>
              <span className="text-[11px] text-slate-400 block truncate font-mono">
                {user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Reporting Month Selector (Chapter 08 & 40) */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={goToPrevMonth}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs font-semibold text-slate-200 px-2 min-w-[110px] text-center">
                {formatMonthDisplay(selectedMonth)}
              </span>

              <button
                onClick={goToNextMonth}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Header Status Badges */}
          <div className="flex items-center gap-3">
            {/* Sample Data Policy Badge (Chapter 08: "A demo workspace may be pre-seeded, but it must be labeled 'Demo data'. Do not combine sample numbers with real user records...") */}
            {user?.isDemo && (
              <div
                className="flex items-center gap-1.5"
                title="Chapter 08 Sample Data Policy: This workspace contains deterministic fictional records labeled Demo Data."
              >
                <Badge variant="amber" size="sm">
                  <Info className="w-3 h-3" />
                  Demo Data
                </Badge>
              </div>
            )}

            {!user?.isDemo && (
              <button
                onClick={demoLogin}
                className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors"
              >
                Switch to Demo Mode
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};
