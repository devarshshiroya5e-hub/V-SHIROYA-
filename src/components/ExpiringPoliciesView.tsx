import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Send, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  ChevronRight,
  ShieldAlert,
  X,
  History,
  Check
} from 'lucide-react';
import { PolicyRecord } from '../types/index';
import { dispatch30DayExpiryAlerts, NotificationAlertResult } from '../lib/api';

interface ExpiringPoliciesViewProps {
  policies: PolicyRecord[];
  onSelectPolicy: (policy: PolicyRecord) => void;
  onOpenAnalyze: () => void;
}

export const ExpiringPoliciesView: React.FC<ExpiringPoliciesViewProps> = ({
  policies,
  onSelectPolicy,
  onOpenAnalyze
}) => {
  const expiringSoon = policies.filter(p => p.policyStatus === 'EXPIRING SOON');
  const expired = policies.filter(p => p.policyStatus === 'EXPIRED');

  const [activeTab, setActiveTab] = useState<'expiring' | 'expired'>('expiring');
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [lastBatchResult, setLastBatchResult] = useState<NotificationAlertResult | null>(null);
  
  // Email Customizer Modal state
  const [selectedPolicyForEmail, setSelectedPolicyForEmail] = useState<PolicyRecord | null>(null);
  const [customEmailSubject, setCustomEmailSubject] = useState('');
  const [customEmailBody, setCustomEmailBody] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const currentList = activeTab === 'expiring' ? expiringSoon : expired;

  const calculateDaysRemaining = (endDateStr: string | null) => {
    if (!endDateStr) return 'N/A';
    try {
      const today = new Date();
      const end = new Date(endDateStr);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
      if (diffDays === 0) return 'Expires today!';
      return `${diffDays} days remaining`;
    } catch (e) {
      return 'N/A';
    }
  };

  const handleBatchDispatch = async () => {
    if (expiringSoon.length === 0) {
      setReminderToast('No policies currently expiring within 30 days.');
      setTimeout(() => setReminderToast(null), 3000);
      return;
    }

    setIsSendingBatch(true);
    try {
      const result = await dispatch30DayExpiryAlerts(expiringSoon.map(p => p.id), 'EMAIL');
      setLastBatchResult(result);
      setReminderToast(`✅ 30-Day Expiry Alerts successfully emailed to ${result.countSent} client(s)!`);
      setTimeout(() => setReminderToast(null), 5000);
    } catch (err) {
      setReminderToast('❌ Failed to dispatch email alert batch.');
      setTimeout(() => setReminderToast(null), 4000);
    } finally {
      setIsSendingBatch(false);
    }
  };

  const openEmailComposer = (policy: PolicyRecord) => {
    setSelectedPolicyForEmail(policy);
    const daysLeft = policy.endDate ? calculateDaysRemaining(policy.endDate) : '30 days remaining';
    setCustomEmailSubject(`URGENT RENEWAL NOTICE: ${policy.providerCompany} Policy #${policy.policyNumber}`);
    setCustomEmailBody(
      `Dear ${policy.ownerName},\n\n` +
      `This is an official 30-Day Renewal Alert from V Shiroya Insurance.\n\n` +
      `Your ${policy.providerCompany} policy (#${policy.policyNumber}) is expiring soon (${daysLeft}).\n` +
      `• Premium Amount: ₹${policy.premiumAmount?.toLocaleString('en-IN') || '0'}\n` +
      `• Expiration Date: ${policy.endDate || 'Upcoming'}\n` +
      `• Nominee: ${policy.nominee || 'As specified in policy'}\n\n` +
      `To protect your uninterrupted insurance coverage, please reply to this email or call our advisor at +91 98765 43210 to initiate instant policy renewal.\n\n` +
      `Sincerely,\n` +
      `V Shiroya Insurance Advisory Services\n` +
      `IRDAI Certified Portal`
    );
  };

  const handleSendSingleEmail = async () => {
    if (!selectedPolicyForEmail) return;
    setIsSendingBatch(true);
    try {
      const result = await dispatch30DayExpiryAlerts([selectedPolicyForEmail.id], 'EMAIL', customEmailBody);
      setReminderToast(`Email alert dispatched to ${selectedPolicyForEmail.ownerName} (${selectedPolicyForEmail.email || 'client email'})!`);
      setSelectedPolicyForEmail(null);
      setTimeout(() => setReminderToast(null), 4000);
    } catch (err) {
      setReminderToast('Failed to send email alert.');
      setTimeout(() => setReminderToast(null), 3000);
    } finally {
      setIsSendingBatch(false);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white rounded-3xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
            <span>30-Day Automated Expiry Alert Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">30-Day Expiry Notification & Renewal Center</h1>
          <p className="text-amber-100 text-xs font-medium mt-1 max-w-xl">
            Automatically monitors policy maturity dates and triggers official 30-day email and UI alerts to ensure clients never suffer lapsed coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
              activeTab === 'expiring' ? 'bg-white text-amber-900 shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Expiring Soon ({expiringSoon.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${
              activeTab === 'expired' ? 'bg-white text-amber-900 shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Expired Lapsed ({expired.length})
          </button>
        </div>
      </div>

      {/* 30-Day Automated Alert Trigger Control Panel */}
      <div className="bg-amber-50/80 dark:bg-amber-950/40 backdrop-blur-sm border border-amber-200/90 dark:border-amber-800/80 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">Automated 30-Day Expiry Email Notification Service</h2>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-300/60 dark:border-emerald-800">
                Service Active
              </span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 font-medium mt-0.5">
              {expiringSoon.length > 0 
                ? `${expiringSoon.length} policyholder(s) have end dates within 30 days and require renewal email alerts.`
                : 'All client policies are healthy. Zero renewals due within 30 days.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastBatchResult && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <History className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>View Audit Receipt ({lastBatchResult.countSent})</span>
            </button>
          )}

          <button
            onClick={handleBatchDispatch}
            disabled={isSendingBatch || expiringSoon.length === 0}
            className={`px-4 py-2 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2 ${
              isSendingBatch || expiringSoon.length === 0
                ? 'bg-amber-200 dark:bg-amber-950/60 text-amber-600 dark:text-amber-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white lift-button'
            }`}
          >
            {isSendingBatch ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Dispatching Email Alerts...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Email Alerts to All 30-Day Expiring ({expiringSoon.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {reminderToast && (
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-3.5 px-4 rounded-xl text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in border border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{reminderToast}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">30-Day Alert Engine</span>
        </div>
      )}

      {/* Main Cards List */}
      {currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentList.map((policy) => (
            <div
              key={policy.id}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{policy.providerCompany}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    policy.policyStatus === 'EXPIRING SOON'
                      ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{calculateDaysRemaining(policy.endDate)}</span>
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate mb-0.5">{policy.ownerName}</h3>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-3">#{policy.policyNumber} • {policy.policyType}</p>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Premium Amount:</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{policy.premiumAmount?.toLocaleString('en-IN') || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Expiration End Date:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{policy.endDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Email Contact:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {policy.email || `${policy.ownerName.toLowerCase().replace(/\s+/g, '.')}@client.com`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                <button
                  onClick={() => openEmailComposer(policy)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Send Custom Email</span>
                </button>

                <button
                  onClick={() => onSelectPolicy(policy)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <span>Inspect & Renew</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center shadow-2xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
            {activeTab === 'expiring' ? 'No policies expiring within 30 days!' : 'No expired policies in record'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            All policy end dates are healthy and up to date.
          </p>
        </div>
      )}

      {/* Single Email Customizer & Composer Modal */}
      {selectedPolicyForEmail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">30-Day Expiry Email Alert Composer</h3>
                  <p className="text-[11px] text-slate-400">Recipient: {selectedPolicyForEmail.ownerName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPolicyForEmail(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={selectedPolicyForEmail.email || `${selectedPolicyForEmail.ownerName.toLowerCase().replace(/\s+/g, '.')}@client-insurance.com`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={customEmailSubject}
                  onChange={(e) => setCustomEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Notice Content</label>
                <textarea
                  rows={8}
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-sans text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedPolicyForEmail(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendSingleEmail}
                disabled={isSendingBatch}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send 30-Day Email Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Audit Receipt Modal */}
      {showHistoryModal && lastBatchResult && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">30-Day Email Alert Dispatch Audit Receipt</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                The following {lastBatchResult.alerts.length} policyholders were notified via email regarding 30-day coverage maturity:
              </p>

              {lastBatchResult.alerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{alert.ownerName}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> {alert.status}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Policy #{alert.policyNumber} • Recipient: {alert.recipientEmail}</p>
                  <p className="text-indigo-700 dark:text-indigo-400 font-mono text-[10px]">{alert.subject}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

