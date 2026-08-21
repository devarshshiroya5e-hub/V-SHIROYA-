import React from 'react';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { PolicyRecord, DashboardStats } from '../types/index';

interface DashboardViewProps {
  stats: DashboardStats;
  policies: PolicyRecord[];
  onOpenAnalyze: () => void;
  onSelectPolicy: (policy: PolicyRecord) => void;
  onSelectTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  policies,
  onOpenAnalyze,
  onSelectPolicy,
  onSelectTab
}) => {
  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Top Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
            Chartered Accountant Workspace
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Policy Portfolio Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Real-time analytics for client insurance policies and premium schedules.
          </p>
        </div>

        <button
          onClick={onOpenAnalyze}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer lift-button"
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze New Policy</span>
        </button>
      </div>

      {/* Expiring Alert Banner */}
      {stats.expiringSoonPolicies > 0 && (
        <div
          onClick={() => onSelectTab('expiring')}
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-4 px-6 shadow-md flex items-center justify-between cursor-pointer hover:opacity-95 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold">
                {stats.expiringSoonPolicies} {stats.expiringSoonPolicies === 1 ? 'policy expires' : 'policies expire'} within 30 days
              </p>
              <p className="text-xs text-amber-100 font-medium">
                Automated 30-Day Email Notification Service ready to dispatch renewal notices.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold bg-white/20 px-3.5 py-2 rounded-xl group-hover:bg-white/30 transition-colors lift-button">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

    </div>
  );
};
