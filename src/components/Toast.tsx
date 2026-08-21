import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-70 animate-in slide-in-from-top-3 fade-in duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
        type === 'success'
          ? 'bg-slate-900 text-white border-slate-800'
          : 'bg-rose-900 text-white border-rose-800'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        )}

        <span className="text-xs font-bold">{message}</span>

        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-2"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
