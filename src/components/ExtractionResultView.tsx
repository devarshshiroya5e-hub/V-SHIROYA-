import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Edit3, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  User, 
  FileText, 
  IndianRupee, 
  Users, 
  Briefcase, 
  Plus, 
  Trash2,
  ArrowLeft,
  FileSpreadsheet,
  Files,
  CheckCheck
} from 'lucide-react';
import { ExtractionResult, PolicyRecord, BatchExtractionItem } from '../types/index';
import { downloadSinglePolicyExcel, downloadPoliciesBulkExcel } from '../lib/excelUtils';
import { storePdfFile } from '../lib/pdfStorage';

interface ExtractionResultViewProps {
  extraction: ExtractionResult;
  fileName: string;
  batchItems?: BatchExtractionItem[];
  onSave: (policyData: Partial<PolicyRecord>) => void;
  onSaveBatch?: (policiesData: Partial<PolicyRecord>[]) => void;
  onCancel: () => void;
  isSaving: boolean;
  onUploadMore?: () => void;
}

export const ExtractionResultView: React.FC<ExtractionResultViewProps> = ({
  extraction,
  fileName,
  batchItems = [],
  onSave,
  onSaveBatch,
  onCancel,
  isSaving,
  onUploadMore
}) => {
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [localBatch, setLocalBatch] = useState<BatchExtractionItem[]>(
    batchItems.length > 0 ? batchItems : [{ id: 'single', fileName, fileType: 'application/pdf', result: extraction }]
  );
  const [isEditing, setIsEditing] = useState(false);

  // Active policy extraction object
  const currentBatchItem = localBatch[activeBatchIndex] || localBatch[0];
  const [formData, setFormData] = useState<ExtractionResult>({ ...currentBatchItem.result });

  // Sync formData when active batch tab changes
  useEffect(() => {
    if (localBatch[activeBatchIndex]) {
      setFormData({ ...localBatch[activeBatchIndex].result });
      setIsEditing(false);
    }
  }, [activeBatchIndex, localBatch]);

  const handleChange = (field: keyof ExtractionResult, value: any) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);

    // Update in localBatch array
    const updatedBatch = [...localBatch];
    updatedBatch[activeBatchIndex] = {
      ...updatedBatch[activeBatchIndex],
      result: updatedForm
    };
    setLocalBatch(updatedBatch);
  };

  const handleAdditionalDetailChange = (index: number, key: 'label' | 'value', value: string) => {
    const updated = [...(formData.additionalDetails || [])];
    updated[index] = { ...updated[index], [key]: value };
    const updatedForm = { ...formData, additionalDetails: updated };
    setFormData(updatedForm);

    const updatedBatch = [...localBatch];
    updatedBatch[activeBatchIndex] = {
      ...updatedBatch[activeBatchIndex],
      result: updatedForm
    };
    setLocalBatch(updatedBatch);
  };

  const handleAddAdditionalDetail = () => {
    const updatedForm = {
      ...formData,
      additionalDetails: [
        ...(formData.additionalDetails || []),
        { label: 'New Field', value: '', confidence: 'high' as const }
      ]
    };
    setFormData(updatedForm);

    const updatedBatch = [...localBatch];
    updatedBatch[activeBatchIndex] = {
      ...updatedBatch[activeBatchIndex],
      result: updatedForm
    };
    setLocalBatch(updatedBatch);
  };

  const handleRemoveAdditionalDetail = (index: number) => {
    const updated = [...(formData.additionalDetails || [])];
    updated.splice(index, 1);
    const updatedForm = { ...formData, additionalDetails: updated };
    setFormData(updatedForm);

    const updatedBatch = [...localBatch];
    updatedBatch[activeBatchIndex] = {
      ...updatedBatch[activeBatchIndex],
      result: updatedForm
    };
    setLocalBatch(updatedBatch);
  };

  const handleSaveAllBatch = () => {
    localBatch.forEach(item => {
      if (item.fileBase64 && item.result.policyNumber) {
        storePdfFile(item.result.policyNumber, item.fileBase64);
      }
    });

    if (onSaveBatch) {
      const recordsToSave: Partial<PolicyRecord>[] = localBatch.map(item => ({
        ...item.result,
        originalFileName: item.fileName,
        fileType: item.fileType,
        documentUrl: item.fileBase64 || null,
        extractedText: item.result.extractedText || ''
      }));
      onSaveBatch(recordsToSave);
    } else {
      if (formData.documentUrl || (extraction as any).fileBase64) {
        const urlToStore = formData.documentUrl || (extraction as any).fileBase64;
        if (urlToStore && formData.policyNumber) {
          storePdfFile(formData.policyNumber, urlToStore);
        }
      }
      onSave(formData);
    }
  };

  const handleExportBatchExcel = () => {
    const records: PolicyRecord[] = localBatch.map((item, idx) => ({
      id: `batch-${idx + 1}`,
      ownerName: item.result.ownerName || 'Unknown Owner',
      policyNumber: item.result.policyNumber || 'UNASSIGNED',
      providerCompany: item.result.providerCompany || 'Insurance Provider',
      policyType: item.result.policyType || 'General Policy',
      category: item.result.category || 'General',
      startDate: item.result.startDate || null,
      endDate: item.result.endDate || null,
      premiumAmount: item.result.premiumAmount ?? null,
      premiumFrequency: item.result.premiumFrequency || 'Annual',
      sumAssured: item.result.sumAssured ?? null,
      insuredPerson: item.result.insuredPerson || item.result.ownerName || null,
      nominee: item.result.nominee || null,
      nomineeRelationship: item.result.nomineeRelationship || null,
      phoneNumber: item.result.phoneNumber || null,
      email: item.result.email || null,
      address: item.result.address || null,
      dateOfBirth: item.result.dateOfBirth || null,
      agentName: item.result.agentName || null,
      agentPhone: item.result.agentPhone || null,
      branchName: item.result.branchName || null,
      paymentMode: item.result.paymentMode || null,
      policyStatus: item.result.policyStatus || 'ACTIVE',
      maturityDate: item.result.maturityDate || null,
      documentUrl: item.fileBase64 || null,
      originalFileName: item.fileName,
      extractedText: item.result.extractedText || '',
      aiConfidence: item.result.confidence || 95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1',
      additionalDetails: item.result.additionalDetails || [],
      missingFields: item.result.missingFields || [],
      uncertainFields: item.result.uncertainFields || []
    }));

    downloadPoliciesBulkExcel(records, `V_Shiroya_Batch_Extraction_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const renderConfidenceBadge = (fieldKey: string) => {
    const confidence = formData.fieldConfidenceMap?.[fieldKey] || 'high';
    if (confidence === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          High confidence
        </span>
      );
    }
    if (confidence === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Medium confidence
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
        <HelpCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        Unclear / Verify
      </span>
    );
  };

  const renderField = (
    label: string,
    fieldKey: keyof ExtractionResult,
    value: string | number | null,
    type: 'text' | 'number' | 'date' = 'text'
  ) => {
    const displayVal = value !== null && value !== undefined && value !== '' ? value : 'Not available';

    return (
      <div className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 rounded-2xl p-3.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all lift-card-primary">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
          {!isEditing && renderConfidenceBadge(fieldKey as string)}
        </div>

        {isEditing ? (
          <input
            type={type}
            value={value ?? ''}
            onChange={(e) => {
              const val = type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value;
              handleChange(fieldKey, val);
            }}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          />
        ) : (
          <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
            {type === 'number' && typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : displayVal}
          </div>
        )}
      </div>
    );
  };

  const isMultiBatch = localBatch.length > 1;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 animate-in fade-in duration-250">
      {/* Top Controls Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={onUploadMore || onCancel}
          className="flex items-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          title="Upload more policy PDFs to queue"
        >
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>Upload More Policy PDFs</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {isMultiBatch ? (
            <button
              onClick={handleExportBatchExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Download entire batch extracted policies as Excel sheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Download Batch Excel ({localBatch.length})</span>
            </button>
          ) : (
            <button
              onClick={() => downloadSinglePolicyExcel(formData)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Download full policy details in Excel format (.xlsx / .csv)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Download Excel Sheet</span>
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            {isEditing ? <RotateCcw className="w-4 h-4" /> : <Edit3 className="w-4 h-4 text-indigo-600" />}
            <span>{isEditing ? 'Cancel Editing' : 'Edit Information'}</span>
          </button>

          {isMultiBatch ? (
            <button
              onClick={handleSaveAllBatch}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{isSaving ? 'Saving Batch...' : `Save All ${localBatch.length} Policies`}</span>
            </button>
          ) : (
            <button
              onClick={() => onSave(formData)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Database...' : 'Save Policy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Batch Policy Document Selector Tabs */}
      {isMultiBatch && (
        <div className="bg-slate-100/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl mb-6 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-indigo-900 dark:text-indigo-300 shrink-0">
            <Files className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Batch ({localBatch.length}):</span>
          </div>
          {localBatch.map((item, idx) => {
            const isActive = idx === activeBatchIndex;
            return (
              <button
                key={idx}
                onClick={() => setActiveBatchIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 shadow-xs border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  #{idx + 1}
                </span>
                <span className="truncate max-w-[140px]">{item.result.ownerName || item.fileName}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-extrabold">
                  {item.result.confidence || 95}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Analysis Summary Header Card with SVG Circular Score Ring */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {isMultiBatch ? `Bulk Item #${activeBatchIndex + 1} Analyzed` : 'Policy Analysis Complete'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded-full text-xs font-bold tracking-wide">
                Engine: V Shiroya High-Speed AI Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formData.ownerName || 'Unnamed Policy Owner'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1">
              Policy #{formData.policyNumber || 'Not available'} • {formData.providerCompany || 'Insurance Provider'}
            </p>
          </div>

          {/* SVG Circular Confidence Ring (#15) */}
          <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-5 py-3 border border-white/10 shadow-inner">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-400 transition-all duration-1000 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={`${formData.confidence || 95}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-black text-amber-300">
                {formData.confidence || 95}%
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">AI Accuracy</span>
              <span className="text-xs font-bold text-emerald-300">High Precision Match</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {currentBatchItem.fileName || fileName}
              </span>
            </div>
          </div>
        </div>

        {/* Specialized OCR Pre-Processing & Insurer Layout Template Banner */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-300 font-bold text-[11px]">OCR Pre-Processing:</span>
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-lg font-bold">
              📄 Doc Type: {formData.documentType || 'POLICY_SCHEDULE'}
            </span>
            <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2.5 py-0.5 rounded-lg font-bold">
              🏢 Insurer: {formData.detectedInsurer || formData.providerCompany || 'Auto-Detected'}
            </span>
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-lg font-bold">
              ⚡ Template: {formData.appliedTemplate || 'Specialized Insurer Scan'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Pre-Processing Match: 100% Precision
          </span>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="space-y-6">
        {/* Policy Information Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-base">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2>Policy Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderField('Policy Number', 'policyNumber', formData.policyNumber)}
            {renderField('Policy Type', 'policyType', formData.policyType)}
            {renderField('Provider Company', 'providerCompany', formData.providerCompany)}
            {renderField('Policy Status', 'policyStatus', formData.policyStatus)}
            {renderField('Start / Commencement Date', 'startDate', formData.startDate, 'date')}
            {renderField('Expiry / End Date', 'endDate', formData.endDate, 'date')}
            {renderField('Maturity Date', 'maturityDate', formData.maturityDate, 'date')}
            {renderField('Branch Name', 'branchName', formData.branchName)}
          </div>
        </div>

        {/* Financial Details Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-base">
            <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2>Financial Coverage & Premium</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderField('Premium Amount (₹)', 'premiumAmount', formData.premiumAmount, 'number')}
            {renderField('Premium Frequency', 'premiumFrequency', formData.premiumFrequency)}
            {renderField('Sum Assured / Insured (₹)', 'sumAssured', formData.sumAssured, 'number')}
            {renderField('Payment Mode', 'paymentMode', formData.paymentMode)}
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-base">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2>Policy Owner Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderField('Owner Full Name', 'ownerName', formData.ownerName)}
            {renderField('Phone Number', 'phoneNumber', formData.phoneNumber)}
            {renderField('Email Address', 'email', formData.email)}
            {renderField('Date of Birth', 'dateOfBirth', formData.dateOfBirth, 'date')}
            {renderField('Insured Person(s)', 'insuredPerson', formData.insuredPerson)}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              {renderField('Mailing / Residential Address', 'address', formData.address)}
            </div>
          </div>
        </div>

        {/* Nominee & Agent Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nominee */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-base">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2>Nominee Details</h2>
            </div>
            <div className="space-y-4">
              {renderField('Nominee Name', 'nominee', formData.nominee)}
              {renderField('Nominee Relationship', 'nomineeRelationship', formData.nomineeRelationship)}
            </div>
          </div>

          {/* Agent */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-base">
              <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2>Agent / Broker Details</h2>
            </div>
            <div className="space-y-4">
              {renderField('Agent Name', 'agentName', formData.agentName)}
              {renderField('Agent Phone Number', 'agentPhone', formData.agentPhone)}
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-extrabold text-base">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2>Additional Clauses & Rider Details</h2>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleAddAdditionalDetail}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Field</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.additionalDetails && formData.additionalDetails.length > 0 ? (
              formData.additionalDetails.map((item, idx) => (
                <div key={idx} className="bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleAdditionalDetailChange(idx, 'label', e.target.value)}
                        className="w-1/3 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleAdditionalDetailChange(idx, 'value', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalDetail(idx)}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic col-span-2">No additional riders or clauses detected in document.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
