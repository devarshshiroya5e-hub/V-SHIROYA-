import React, { useState, useEffect } from 'react';
import { Shield, User, CheckCircle2 } from 'lucide-react';
import { AccountantUser, SecurityAuditLog } from '../types/index';
import { fetchSecurityAuditLogs, updateFirestoreProfile } from '../lib/api';

interface SettingsViewProps {
  user: AccountantUser;
  onUpdateUser: (user: AccountantUser) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<AccountantUser>({ ...user });
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchSecurityAuditLogs().then(logs => setAuditLogs(logs));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateFirestoreProfile(formData.id, formData);
    } catch (err) {
      console.warn('Firestore profile update notice:', err);
    }
    onUpdateUser(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl min-w-0 overflow-hidden mx-auto space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Settings & Security Audit</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Accountant profile and security access logs.
        </p>
      </div>

      {/* Account Profile Form */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs lift-card-primary">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-base">
          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2>Accountant Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">CA Firm / Office Name</label>
              <input
                type="text"
                value={formData.firmName}
                onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Professional Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Security Access Logs */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs lift-card-subtle">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-base">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2>Security & Access Audit Logs</h2>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{log.action} • <span className="text-slate-600 dark:text-slate-400">{log.actor}</span></p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono shrink-0 ml-3">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
