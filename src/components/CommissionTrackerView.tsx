import React, { useState, useMemo } from 'react';
import { 
  CircleDollarSign, 
  TrendingUp, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  Download, 
  Building2, 
  PieChart as PieChartIcon,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { PolicyRecord } from '../types/index';

interface CommissionTrackerViewProps {
  policies: PolicyRecord[];
}

export const CommissionTrackerView: React.FC<CommissionTrackerViewProps> = ({ policies }) => {
  const [lifeRate, setLifeRate] = useState(20);
  const [healthRate, setHealthRate] = useState(15);
  const [motorRate, setMotorRate] = useState(10);
  const [generalRate, setGeneralRate] = useState(12);

  // Compute calculated commission metrics per policy
  const policyCommissions = useMemo(() => {
    return policies.map((p) => {
      const type = (p.policyType || '').toLowerCase();
      let rate = 15;
      if (type.includes('life') || type.includes('term') || type.includes('endowment') || type.includes('ulip')) {
        rate = lifeRate;
      } else if (type.includes('health') || type.includes('mediclaim') || type.includes('floater')) {
        rate = healthRate;
      } else if (type.includes('motor') || type.includes('vehicle') || type.includes('car') || type.includes('bike')) {
        rate = motorRate;
      } else {
        rate = generalRate;
      }

      const premium = p.premiumAmount || 0;
      const commissionValue = Math.round((premium * rate) / 100);
      const isPaid = p.policyStatus === 'ACTIVE'; // active policies paid commission, expiring/other pending

      return {
        ...p,
        rate,
        commissionValue,
        isPaid
      };
    });
  }, [policies, lifeRate, healthRate, motorRate, generalRate]);

  const totalEarnedCommission = policyCommissions.filter(p => p.isPaid).reduce((sum, p) => sum + p.commissionValue, 0);
  const totalPendingCommission = policyCommissions.filter(p => !p.isPaid).reduce((sum, p) => sum + p.commissionValue, 0);
  const totalGrossPremium = policies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);

  // Insurer breakdown
  const providerBreakdown = useMemo(() => {
    const map = new Map<string, { totalPremium: number; totalCommission: number; count: number }>();
    policyCommissions.forEach(p => {
      const prov = p.providerCompany || 'Other Insurer';
      if (!map.has(prov)) {
        map.set(prov, { totalPremium: p.premiumAmount || 0, totalCommission: p.commissionValue, count: 1 });
      } else {
        const cur = map.get(prov)!;
        cur.totalPremium += p.premiumAmount || 0;
        cur.totalCommission += p.commissionValue;
        cur.count += 1;
      }
    });
    return Array.from(map.entries()).map(([provider, data]) => ({ provider, ...data }));
  }, [policyCommissions]);

  const handleExportCommissionCsv = () => {
    const headers = ['Policy Number', 'Owner Name', 'Insurer', 'Policy Type', 'Premium (₹)', 'Commission %', 'Estimated Commission (₹)', 'Status'];
    const rows = policyCommissions.map(p => [
      `"${p.policyNumber}"`,
      `"${p.ownerName}"`,
      `"${p.providerCompany}"`,
      `"${p.policyType}"`,
      p.premiumAmount || 0,
      `${p.rate}%`,
      p.commissionValue,
      p.isPaid ? 'PAID' : 'PENDING'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(',')).join('\n')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `V_Shiroya_Insurance_Commission_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
              <CircleDollarSign className="w-3.5 h-3.5" /> V Shiroya Insurance Revenue & Commission Matrix
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Agent Commission & Payout Tracker</h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Track agent commissions, payout schedules, and expected revenue across all Indian and global insurance providers from a single interface.
            </p>
          </div>

          <button
            onClick={handleExportCommissionCsv}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Commission Statement
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Earned Commission</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">₹{totalEarnedCommission.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Realized revenue from active policies</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Payouts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">₹{totalPendingCommission.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Renewals & pending policy commissions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Managed Premium</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">₹{totalGrossPremium.toLocaleString('en-IN')}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
            Avg Commission Yield: {totalGrossPremium > 0 ? (((totalEarnedCommission + totalPendingCommission) / totalGrossPremium) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Interactive Commission Rate Calculator Slider */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Line-of-Business Commission Rate Settings</h2>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
            IRDAI Compliant Slabs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Life Insurance Slab</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{lifeRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              value={lifeRate}
              onChange={(e) => setLifeRate(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Health Insurance Slab</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{healthRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={healthRate}
              onChange={(e) => setHealthRate(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Motor Insurance Slab</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">{motorRate}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              value={motorRate}
              onChange={(e) => setMotorRate(parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>General Insurance Slab</span>
              <span className="text-blue-600 dark:text-blue-400 font-extrabold">{generalRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              value={generalRate}
              onChange={(e) => setGeneralRate(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Insurer Commission Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400" /> Insurer Provider Yield Analysis
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Insurer Company</th>
                <th className="py-3 px-3">Policies Managed</th>
                <th className="py-3 px-3">Total Gross Premium (₹)</th>
                <th className="py-3 px-3">Est. Agent Commission (₹)</th>
                <th className="py-3 px-3 text-right">Yield %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {providerBreakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-3 font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {row.provider}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">{row.count} policies</td>
                  <td className="py-3.5 px-3 font-extrabold text-slate-900 dark:text-slate-100">₹{row.totalPremium.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 font-extrabold text-emerald-700 dark:text-emerald-400">₹{row.totalCommission.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-indigo-600 dark:text-indigo-400">
                    {row.totalPremium > 0 ? ((row.totalCommission / row.totalPremium) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
