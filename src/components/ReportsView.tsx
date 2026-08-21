import React from 'react';
import { Download, Printer, BarChart3, PieChart as PieIcon, FileText, CheckCircle2, IndianRupee } from 'lucide-react';
import { PolicyRecord, DashboardStats } from '../types/index';

interface ReportsViewProps {
  stats: DashboardStats;
  policies: PolicyRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ stats, policies }) => {
  const handleExportCsv = () => {
    const headers = ['Owner Name', 'Policy Number', 'Provider Company', 'Policy Type', 'Start Date', 'End Date', 'Premium (INR)', 'Sum Assured', 'Status', 'Phone', 'Email', 'Nominee'];
    const rows = policies.map(p => [
      `"${p.ownerName}"`,
      `"${p.policyNumber}"`,
      `"${p.providerCompany}"`,
      `"${p.policyType}"`,
      `"${p.startDate || ''}"`,
      `"${p.endDate || ''}"`,
      p.premiumAmount || 0,
      p.sumAssured || 0,
      `"${p.policyStatus}"`,
      `"${p.phoneNumber || ''}"`,
      `"${p.email || ''}"`,
      `"${p.nominee || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PolicyAI_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Compute breakdown by provider
  const providerSummary: Record<string, { count: number; totalPremium: number }> = {};
  policies.forEach(p => {
    const prov = p.providerCompany || 'Other';
    if (!providerSummary[prov]) {
      providerSummary[prov] = { count: 0, totalPremium: 0 };
    }
    providerSummary[prov].count += 1;
    providerSummary[prov].totalPremium += Number(p.premiumAmount) || 0;
  });

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Accountant Audit & Financial Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Export complete policy portfolios, premium schedules, and provider distribution summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Audit Summary</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs lift-card-primary">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Portfolio Policies</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 block mt-1">{stats.totalPolicies}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs lift-card-primary">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Premium Value</span>
          <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 block mt-1">₹{stats.totalPremiumValue.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs lift-card-primary">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active In-Force Policies</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">{stats.activePolicies}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs lift-card-primary">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Expiring / Lapsed</span>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 block mt-1">{stats.expiringSoonPolicies + stats.expiredPolicies}</span>
        </div>
      </div>

      {/* Provider Company Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs lift-card-secondary">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">Insurance Provider Breakdown</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Summary of policies and total premium volume grouped by insurance company</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Insurance Company</th>
                <th className="py-3 px-3">Policy Count</th>
                <th className="py-3 px-3">Combined Premium Value (₹)</th>
                <th className="py-3 px-3 text-right">% Portfolio Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {Object.keys(providerSummary).map((prov, i) => {
                const item = providerSummary[prov];
                const sharePercent = stats.totalPolicies > 0 ? ((item.count / stats.totalPolicies) * 100).toFixed(1) : 0;

                return (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100">{prov}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{item.count} policies</td>
                    <td className="py-3.5 px-3 font-extrabold text-indigo-900 dark:text-indigo-300">₹{item.totalPremium.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-600 dark:text-slate-400">{sharePercent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
