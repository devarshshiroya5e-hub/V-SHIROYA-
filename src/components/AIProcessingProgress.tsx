import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Sparkles, Files, Scan, Database, ShieldCheck, Cpu } from 'lucide-react';

interface AIProcessingProgressProps {
  fileName?: string;
  bulkCurrent?: number;
  bulkTotal?: number;
  currentFileName?: string;
  completedCount?: number;
}

export const AIProcessingProgress: React.FC<AIProcessingProgressProps> = ({
  fileName,
  bulkCurrent = 1,
  bulkTotal = 1,
  currentFileName,
  completedCount = 0
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { title: 'Validating Document Format & Security', desc: 'Checking PDF/Image integrity and clearance.' },
    { title: 'Document OCR & Text Extraction', desc: 'Reading policy schedules, tables, and fine print.' },
    { title: 'Identifying Policy & Financial Fields', desc: 'Extracting Policy #, Premium, Sum Assured, Nominee, Dates.' },
    { title: 'Validating Extracted Fields & Confidence Scoring', desc: 'Distinguishing high, medium, and missing fields.' },
    { title: 'Preparing Policy Summary', desc: 'Finalizing zero-hallucination structured JSON.' }
  ];

  const activeDocName = currentFileName || fileName || 'Policy Document';

  useEffect(() => {
    setCurrentStepIndex(0);
    const timer1 = setTimeout(() => setCurrentStepIndex(1), 100);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 250);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 450);
    const timer4 = setTimeout(() => setCurrentStepIndex(4), 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [bulkCurrent, activeDocName]);

  const isBulk = bulkTotal > 1;

  // Extracted Field Nodes for Visual Feedback (#12)
  const extractionNodes = [
    'Policy #', 'Premium', 'Expiry Date', 'Nominee', 'Sum Assured', 'Insurer', 'Riders'
  ];

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        {/* Stage 1-3 AI Visualization Silhouette Scanner */}
        <div className="relative w-full h-32 mb-6 rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
          {/* Laser Scanning Bar */}
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-laser-scan z-10" />

          {/* Document Silhouette Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

          {/* Central AI Breathing Core Circle */}
          <div className="relative z-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/50 border-t-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 opacity-80 animate-pulse flex items-center justify-center text-white shadow-lg">
              <Cpu className="w-6 h-6 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Extracted Floating Field Node Pills (#12) */}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 p-3 pointer-events-none z-10 opacity-80">
            {extractionNodes.map((node, i) => (
              <span
                key={node}
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all duration-500 ${
                  i <= currentStepIndex + 2
                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 scale-100 opacity-100 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-800/40 text-slate-500 border-slate-700/40 scale-90 opacity-40'
                }`}
              >
                ✓ {node}
              </span>
            ))}
          </div>
        </div>

        {isBulk ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Files className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Bulk PDF Batch Processing ({bulkCurrent} / {bulkTotal})</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
              Analyzing Policy Document {bulkCurrent} of {bulkTotal}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
              Processing <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeDocName}</span> using V Shiroya AI Engine...
            </p>

            {/* Overall Bulk Batch Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                <span>Batch Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400">{Math.round((completedCount / bulkTotal) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-indigo-600 via-amber-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${Math.max(5, ((completedCount) / bulkTotal) * 100)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-1">
              Analyzing Policy Document
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
              Processing <span className="font-semibold text-slate-800 dark:text-slate-200">{activeDocName}</span> using V Shiroya AI Engine...
            </p>

            {/* Single File Step Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mb-8 overflow-hidden border border-slate-200/60 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-indigo-600 via-amber-500 to-indigo-500 h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </>
        )}

        {/* Step Items List */}
        <div className="space-y-3.5 text-left max-w-lg mx-auto">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 p-3 rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-2xs translate-x-1'
                    : isDone
                    ? 'bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800'
                    : 'opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in-50 duration-200" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${
                    isCurrent
                      ? 'text-indigo-900 dark:text-indigo-200'
                      : isDone
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className={`text-xs ${
                    isCurrent
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>V Shiroya AI High-Speed Pipeline Active</span>
        </div>
      </div>
    </div>
  );
};

