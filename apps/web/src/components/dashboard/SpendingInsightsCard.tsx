import React from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { Lightbulb, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const SpendingInsightsCard: React.FC = () => {
  const { insights, dismissInsight } = useFinancial();

  const activeInsights = insights.filter(i => !i.dismissed);

  if (activeInsights.length === 0) return null;

  return (
    <div className="space-y-3">
      {activeInsights.map(insight => {
        const isUpward = insight.amountDifferenceCents > 0;

        return (
          <div
            key={insight.id}
            className="p-4 bg-slate-900/90 border border-indigo-900/40 rounded-2xl flex items-start justify-between gap-4 shadow-lg shadow-indigo-950/20"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">
                    {insight.headline}
                  </h4>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isUpward ? 'bg-amber-950/60 text-amber-300' : 'bg-emerald-950/60 text-emerald-300'
                    }`}
                  >
                    {isUpward ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(insight.percentageDifference)}%
                  </span>
                </div>

                {/* Chapter 19 & Chapter 40 Compliance: Explains baseline and difference calmly */}
                <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {insight.explanation}
                </p>
              </div>
            </div>

            <button
              onClick={() => dismissInsight(insight.id)}
              className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              title="Dismiss this insight"
              aria-label="Dismiss insight"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
