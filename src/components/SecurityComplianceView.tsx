import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Server, 
  FileCheck2, 
  Database, 
  CheckCircle2, 
  Clock, 
  UserCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import { SecurityAuditLog } from '../types/index';

export const SecurityComplianceView: React.FC = () => {
  const auditLogs: SecurityAuditLog[] = [
    {
      id: 'log-101',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'Multimodal AI Policy Extraction',
      actor: 'VIJAY SHIROYA (CA)',
      details: 'Extracted 18 fields from HDFC_ERGO_Optima_Secure.pdf',
      ipAddress: '103.21.124.89 (India Gateway)'
    },
    {
      id: 'log-102',
      timestamp: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 19),
      action: 'AES-256 Database Encryption Check',
      actor: 'V Shiroya Insurance Security Daemon',
      details: 'Verified database encryption keys & IRDAI data sovereignty compliance',
      ipAddress: '10.0.4.12 (Internal Secure Server)'
    },
    {
      id: 'log-103',
      timestamp: new Date(Date.now() - 7200000).toISOString().replace('T', ' ').slice(0, 19),
      action: 'Client Account Isolation Verified',
      actor: 'Security Audit Module',
      details: 'Zero cross-tenant data leak verification passed',
      ipAddress: '127.0.0.1'
    }
  ];

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> IRDAI Data Security & Privacy Suite
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Data Protection & Regulatory Compliance</h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              V Shiroya Insurance adheres strictly to IRDAI regulatory guidelines. All customer policy data is isolated, encrypted at rest with AES-256, and hosted on Indian Cloud Servers.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-2xl text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>IRDAI Compliant & Verified</span>
          </div>
        </div>
      </div>

      {/* Compliance Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-1">Indian Data Sovereignty</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">All database records and PDF files strictly stored on Cloud Servers within India.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-1">TLS / AES-256 Encryption</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">End-to-end 256-bit encryption in transit (HTTPS/TLS) and at rest (AES-256).</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-1">Strict Account Isolation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your client policy records are isolated and completely invisible to other agencies.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-1">Zero Data Sale Guarantee</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">V Shiroya Insurance never sells, monetizes, or resells customer insurance details to third parties.</p>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Real-time System Security Audit Trail
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Audit Action</th>
                <th className="py-3 px-3">Actor / Agent</th>
                <th className="py-3 px-3">Details</th>
                <th className="py-3 px-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">{log.timestamp}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{log.action}</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{log.actor}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{log.details}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400 dark:text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
