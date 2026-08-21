import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Edit3, 
  Trash2, 
  User, 
  IndianRupee, 
  ShieldCheck, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  Briefcase, 
  Building2,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { PolicyRecord } from '../types/index';
import { downloadPolicyPdf } from '../lib/pdfUtils';
import { downloadSinglePolicyExcel } from '../lib/excelUtils';

interface PolicyDetailModalProps {
  policy: PolicyRecord | null;
  onClose: () => void;
  onUpdate: (policy: PolicyRecord) => void;
  onDelete: (id: string) => void;
}

export const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  policy,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'text' | 'document'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!policy) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(policy.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleExportPdfSummary = () => {
    // Generate printable print window for accountant record
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PolicyAI Audit Summary - ${policy.ownerName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; }
            .subtitle { font-size: 14px; color: #64748b; }
            .section { margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .field-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
            .field-value { font-size: 14px; font-weight: 700; color: #0f172a; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${policy.ownerName}</div>
              <div class="subtitle">Policy Number: #${policy.policyNumber} | ${policy.providerCompany}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 800; color: #059669;">₹${policy.premiumAmount?.toLocaleString('en-IN') || 0}</div>
              <div class="subtitle">${policy.policyType} (${policy.policyStatus})</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Policy & Coverage Overview</div>
            <div class="grid">
              <div><div class="field-label">Policy Number</div><div class="field-value">${policy.policyNumber}</div></div>
              <div><div class="field-label">Provider</div><div class="field-value">${policy.providerCompany}</div></div>
              <div><div class="field-label">Sum Assured</div><div class="field-value">₹${policy.sumAssured?.toLocaleString('en-IN') || 'N/A'}</div></div>
              <div><div class="field-label">Payment Mode</div><div class="field-value">${policy.paymentMode || 'N/A'}</div></div>
              <div><div class="field-label">Start Date</div><div class="field-value">${policy.startDate || 'N/A'}</div></div>
              <div><div class="field-label">End Date</div><div class="field-value">${policy.endDate || 'N/A'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Owner & Contact Details</div>
            <div class="grid">
              <div><div class="field-label">Owner Name</div><div class="field-value">${policy.ownerName}</div></div>
              <div><div class="field-label">Phone Number</div><div class="field-value">${policy.phoneNumber || 'N/A'}</div></div>
              <div><div class="field-label">Email</div><div class="field-value">${policy.email || 'N/A'}</div></div>
              <div><div class="field-label">Date of Birth</div><div class="field-value">${policy.dateOfBirth || 'N/A'}</div></div>
              <div style="grid-column: span 2;"><div class="field-label">Address</div><div class="field-value">${policy.address || 'N/A'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Nominee & Agent</div>
            <div class="grid">
              <div><div class="field-label">Nominee Name</div><div class="field-value">${policy.nominee || 'N/A'}</div></div>
              <div><div class="field-label">Relationship</div><div class="field-value">${policy.nomineeRelationship || 'N/A'}</div></div>
              <div><div class="field-label">Agent Name</div><div class="field-value">${policy.agentName || 'N/A'}</div></div>
              <div><div class="field-label">Agent Phone</div><div class="field-value">${policy.agentPhone || 'N/A'}</div></div>
            </div>
          </div>

          <div class="footer">
            Generated securely by PolicyAI SaaS • Accountant Audit Copy • ${new Date().toLocaleDateString()}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-none z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden my-8 scale-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{policy.ownerName}</h2>
              <p className="text-xs text-slate-300">
                Policy #{policy.policyNumber} • {policy.providerCompany}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSinglePolicyExcel(policy)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Download policy details as an Excel worksheet (.xlsx / .csv)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel</span>
            </button>

            <button
              onClick={() => downloadPolicyPdf(policy)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              policy.policyStatus === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : policy.policyStatus === 'EXPIRING SOON'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
            }`}>
              {policy.policyStatus}
            </span>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Tabs Header */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Policy Overview
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'text'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Extracted OCR Text
          </button>

          <button
            onClick={() => setActiveTab('document')}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'document'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Original Document ({policy.originalFileName})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Highlight Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Premium Amount</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">₹{policy.premiumAmount?.toLocaleString('en-IN') || 0}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Frequency: {policy.premiumFrequency || 'Annual'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Sum Assured & Category</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">₹{policy.sumAssured?.toLocaleString('en-IN') || 'N/A'}</span>
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 block font-bold mt-0.5">
                    Category: {policy.category || 'General'} • {policy.policyType}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Policy End Date</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{policy.endDate || 'Not available'}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Start: {policy.startDate || 'N/A'}</span>
                </div>
              </div>

              {/* Policy & Owner Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Owner Name</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{policy.ownerName}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Contact Phone</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{policy.phoneNumber || 'Not available'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Email Address</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{policy.email || 'Not available'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Nominee & Relation</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {policy.nominee ? `${policy.nominee} (${policy.nomineeRelationship || 'Nominee'})` : 'Not available'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-700/60 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Residential Address</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{policy.address || 'Not available'}</span>
                </div>
              </div>

              {/* Additional Details */}
              {policy.additionalDetails && policy.additionalDetails.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Additional Policy Clauses & Riders</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {policy.additionalDetails.map((det, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">{det.label}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{det.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="bg-slate-900 dark:bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-2xl whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-slate-800">
              {policy.extractedText || 'No raw OCR text stored.'}
            </div>
          )}

          {activeTab === 'document' && (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{policy.originalFileName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Original policy file stored in secure vault.</p>
              <button
                onClick={handleExportPdfSummary}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                View / Print Document Summary
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Policy</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSinglePolicyExcel(policy)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Download Excel Sheet</span>
            </button>

            <button
              onClick={handleExportPdfSummary}
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF Audit Copy</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-transparent dark:border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Sub-modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">Delete Policy Record?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{policy.ownerName}'s</span> policy (#{policy.policyNumber})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
