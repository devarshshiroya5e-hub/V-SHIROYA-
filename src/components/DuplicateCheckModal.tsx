import React from 'react';
import { AlertTriangle, X, CheckCircle, ArrowRight } from 'lucide-react';
import { PolicyRecord } from '../types/index';

interface DuplicateCheckModalProps {
  existingPolicy: PolicyRecord;
  newPolicyData: Partial<PolicyRecord>;
  onSaveAnyway: () => void;
  onReviewExisting: (existing: PolicyRecord) => void;
  onCancel: () => void;
}

export const DuplicateCheckModal: React.FC<DuplicateCheckModalProps> = ({
  existingPolicy,
  newPolicyData,
  onSaveAnyway,
  onReviewExisting,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden my-8 scale-in-95 duration-150 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Possible Duplicate Policy Detected</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A policy matching Policy #{newPolicyData.policyNumber || 'Unknown'} or owner name already exists in your database.
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Existing */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Existing Record</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{existingPolicy.ownerName}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-2">Policy #{existingPolicy.policyNumber}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{existingPolicy.providerCompany}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold text-slate-700 dark:text-slate-200">Premium: ₹{existingPolicy.premiumAmount?.toLocaleString('en-IN') || 0}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Added: {new Date(existingPolicy.createdAt).toLocaleDateString()}</p>
          </div>

          {/* New */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/60 backdrop-blur-sm border border-indigo-200/90 dark:border-indigo-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-2">New Uploaded Record</span>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{newPolicyData.ownerName}</p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold mb-2">Policy #{newPolicyData.policyNumber}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{newPolicyData.providerCompany}</p>
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mt-1">Premium: ₹{newPolicyData.premiumAmount?.toLocaleString('en-IN') || 0}</p>
            <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-2">New Upload</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onReviewExisting(existingPolicy)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Review Existing Policy
          </button>
          <button
            onClick={onSaveAnyway}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
};
