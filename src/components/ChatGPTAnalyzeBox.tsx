import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  X, 
  ArrowRight,
  ShieldAlert,
  Info,
  Plus,
  Trash2,
  Files
} from 'lucide-react';
import { QueueFileItem } from '../types/index';

interface ChatGPTAnalyzeBoxProps {
  onAnalyzeBulk: (files: QueueFileItem[], instruction: string) => void;
  isLoading: boolean;
}

export const ChatGPTAnalyzeBox: React.FC<ChatGPTAnalyzeBoxProps> = ({
  onAnalyzeBulk,
  isLoading
}) => {
  const [files, setFiles] = useState<QueueFileItem[]>([]);
  const [instruction, setInstruction] = useState("YOU ARE THE WORLD'S BEST IMAGE AND DOCUMENT ANALYZER. COMMAND: Perform deep 100% OCR layout scan across all pages. Extract every single detail including Policy Number, Owner Name, Insurer, Premium, Start/End Dates, Sum Assured, Nominees, Riders, and GST breakdowns regardless of company layout format.");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFiles = (selectedFileList: FileList | File[]) => {
    setErrorMsg(null);
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const newItems: QueueFileItem[] = [];

    Array.from(selectedFileList).forEach((selectedFile) => {
      if (!validTypes.includes(selectedFile.type)) {
        setErrorMsg(`"${selectedFile.name}" is not a supported file. Please upload PDF, PNG, JPG, or JPEG documents.`);
        return;
      }

      if (selectedFile.size > 25 * 1024 * 1024) {
        setErrorMsg(`"${selectedFile.name}" exceeds the 25MB file size limit.`);
        return;
      }

      // Check duplicate in current queue
      const existing = files.find(f => f.file.name === selectedFile.name && f.file.size === selectedFile.size);
      if (existing) return;

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newItem: QueueFileItem = {
        id: fileId,
        file: selectedFile,
        status: 'pending'
      };

      // Read Base64 asynchronously
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        setFiles(prev => prev.map(item => item.id === fileId ? { ...item, fileBase64: resultStr } : item));
      };
      reader.readAsDataURL(selectedFile);

      newItems.push(newItem);
    });

    if (newItems.length > 0) {
      setFiles(prev => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setErrorMsg('Please upload at least one policy PDF or image document to analyze.');
      return;
    }

    const filesStillLoading = files.some(file => !file.fileBase64);
    if (filesStillLoading) {
      setErrorMsg('Please wait a moment while the uploaded document is being prepared.');
      return;
    }

    onAnalyzeBulk(files, instruction);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      {/* Header Title with Shimmer and Staggered Reveal */}
      <div className="text-center mb-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 rounded-full text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-widest mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>V Shiroya AI Bulk PDF Extraction Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          Upload & Analyze <span className="animated-shimmer-text">Policy Documents in Bulk</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
          Upload single or multiple policy PDFs. Our AI extracts policy numbers, premiums, nominees, dates, riders, and financial details with 100% precision.
        </p>
      </div>

      {/* Main Upload Box & Input Form */}
      <form
        onSubmit={handleSubmit}
        className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${
          isDragging
            ? 'border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-950/80 bg-indigo-50/20 dark:bg-indigo-950/40 scale-[1.01]'
            : 'border-slate-200/90 dark:border-slate-800 shadow-slate-100 dark:shadow-none hover:border-indigo-300 dark:hover:border-indigo-700'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Laser Scanner Light Bar when dragging or hovering */}
        {isDragging && (
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-laser-scan z-20 pointer-events-none" />
        )}

        {/* Hidden File Input with 'multiple' enabled */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && processSelectedFiles(e.target.files)}
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          className="hidden"
        />

        {/* MODE A: Initial Dropzone when 0 files uploaded */}
        {files.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-8 sm:p-10 text-center cursor-pointer bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 group transition-all duration-300 overflow-hidden"
          >
            {/* Corner Scanner Bracket Overlay Marks */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-400 dark:border-indigo-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-400 dark:border-indigo-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-400 dark:border-indigo-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-400 dark:border-indigo-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />

            {/* Radar Pulse when Dragging */}
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border border-indigo-400/50 animate-radar-pulse" />
              </div>
            )}

            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 shadow-xs relative">
              <FileUp className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping" />
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              {isDragging ? '⚡ Release to Analyse Document' : 'Click to upload or drag & drop policy documents'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
              Supports multiple PDFs, PNGs, JPGs • Max 25MB per file
            </p>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs group-hover:border-indigo-400 dark:group-hover:border-indigo-500 transition-colors">
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Select Single or Bulk Policy PDFs
            </span>
          </div>
        ) : (
          /* MODE B: Files Queue Present - STICKY / ALWAYS VISIBLE Upload Dropzone & File List */
          <div className="space-y-4">
            {/* Queue Header & Clear All Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                  {files.length}
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {files.length === 1 ? '1 Policy PDF Ready for Analysis' : `${files.length} Policy PDFs Queued for Bulk Analysis`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Queue
              </button>
            </div>

            {/* List of Uploaded Policy PDF Cards */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-700 transition-all animate-in fade-in"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-extrabold text-xs">
                      #{idx + 1}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.file.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {formatFileSize(item.file.size)} • {item.file.type.split('/')[1]?.toUpperCase() || 'PDF'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                    title="Remove file from queue"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* PERSISTENT UPLOAD BUTTON / COMPACT DROPZONE - Always visible after uploading 1 or more PDFs */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/60 rounded-2xl p-3.5 text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span>Upload More PDFs (Click or Drag & Drop additional files)</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AI Engine & Prompt Guidance Banner */}
        <div className="mt-4 p-3 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>V Shiroya High-Speed AI Engine</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200/80 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">
            Bulk PDF High-Recall Processing Active
          </span>
        </div>

        {/* Instruction Prompt Input Area */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              AI Prompt Instruction for Batch
            </label>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Applied across all uploaded PDFs</span>
          </div>
          <textarea
            rows={2}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Extract all policy fields including End Date/Expiry Date, Sum Assured, Nominee, and all PDF clauses."
            className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none"
          />

          {/* Quick Prompt Preset Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Quick Commands:</span>
            <button
              type="button"
              onClick={() => setInstruction(" COMMAND: Extract Commencement Date, Policy Duration/Term, Expiry Date, and Maturity Date. Calculate exact coverage period if end date is unprinted. YOU ARE THE WORLD'S BEST IMAGE AND DOCUMENT ANALYZER. COMMAND: Perform deep 100% OCR layout scan across all pages. Extract every single detail including Policy Number, Owner Name, Insurer, Premium, Start/End Dates, Sum Assured, Nominees, Riders, and GST breakdowns regardless of company layout format. ")}
              className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs font-bold"
            >
              ✨ Custom
            </button>
            <button
              type="button"
              onClick={() => setInstruction("YOU ARE THE WORLD'S BEST IMAGE ANALYZER. COMMAND: Perform deep 100% visual OCR scan. Extract all fields, dates, premiums, and schedule tables with zero omissions.")}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              ⚡ World's Best OCR Scan (100% Recall)
            </button>
            <button
              type="button"
              onClick={() => setInstruction("COMMAND: Adapt to company template layout (LIC, HDFC ERGO, ICICI, Star Health, SBI Life, Max Life, Niva Bupa, Digit). Scan schedule grids, rider boxes, nominee blocks, and agent codes wherever located.")}
              className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              🏢 Adapt All Company Layouts
            </button>
            <button
              type="button"
              onClick={() => setInstruction("COMMAND: Extract Commencement Date, Policy Duration/Term, Expiry Date, and Maturity Date. Calculate exact coverage period if end date is unprinted.")}
              className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              📅 Calculate End Date & Term
            </button>
            <button
              type="button"
              onClick={() => setInstruction("COMMAND: Deep PDF Audit. Extract every schedule table, rider, GST tax breakdown, nominee details, and agent code into additionalDetails.")}
              className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              🔍 Deep Audit (Every Detail)
            </button>
          </div>
        </div>

        {/* Bottom Bar Controls */}
        <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Powered by V Shiroya AI Engine</span>
          </div>

          <button
            type="submit"
            disabled={
              isLoading ||
              files.length === 0 ||
              files.some(file => !file.fileBase64)
            }
            className={`flex items-center gap-2.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all duration-180 ease-out cursor-pointer ${
              isLoading || files.length === 0 || files.some(file => !file.fileBase64)
                ? 'opacity-50 cursor-not-allowed shadow-none'
                : 'hover:-translate-y-0.5'
            }`}
          >
            <Files className="w-4 h-4" />
            <span>
              {isLoading
                ? 'Analyzing Policy Batch...'
                : files.length <= 1
                ? 'Analyze Policy'
                : `Analyze ${files.length} Policies in Bulk`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
