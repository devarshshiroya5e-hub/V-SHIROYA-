/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ChatGPTAnalyzeBox } from './components/ChatGPTAnalyzeBox';
import { AIProcessingProgress } from './components/AIProcessingProgress';
import { ExtractionResultView } from './components/ExtractionResultView';
import { DashboardView } from './components/DashboardView';
import { PoliciesListView } from './components/PoliciesListView';
import { ExpiringPoliciesView } from './components/ExpiringPoliciesView';
import { ClientsCrmView } from './components/ClientsCrmView';
import { CommissionTrackerView } from './components/CommissionTrackerView';
import { ClaimsIntimationView } from './components/ClaimsIntimationView';
import { SecurityComplianceView } from './components/SecurityComplianceView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PolicyDetailModal } from './components/PolicyDetailModal';
import { DuplicateCheckModal } from './components/DuplicateCheckModal';
import { Toast } from './components/Toast';
import { AiBackground } from './components/AiBackground';
import { storePdfFile } from './lib/pdfStorage';

import { 
  PolicyRecord, 
  ExtractionResult, 
  AccountantUser, 
  DashboardStats,
  QueueFileItem,
  BatchExtractionItem
} from './types/index';

import { 
  fetchPolicies, 
  analyzePolicyDocument, 
  savePolicyRecord, 
  updatePolicyRecord, 
  deletePolicyRecord, 
  fetchDashboardStats, 
  checkDuplicatePolicy,
  getLocalPolicies
} from './lib/api';
import { subscribeToFirestorePolicies } from './lib/firebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('policyai_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {
      console.warn('Failed to read dark mode setting', e);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('policyai_dark_mode', 'true');
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('policyai_dark_mode', 'false');
      } catch (e) {}
    }
  }, [isDarkMode]);

  // Core Data
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPolicies: 0,
    activePolicies: 0,
    expiredPolicies: 0,
    expiringSoonPolicies: 0,
    totalPremiumValue: 0,
    policiesAddedThisMonth: 0
  });

  const [user, setUser] = useState<AccountantUser>(() => {
    try {
      const saved = localStorage.getItem('policyai_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Bhavik Patel') {
          parsed.name = 'VIJAY SHIROYA';
          parsed.firmName = 'VIJAY SHIROYA & Co. Chartered Accountants';
          parsed.email = 'vijay.ca@policyai.com';
          localStorage.setItem('policyai_user_profile', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored user profile', e);
    }
    return {
      id: 'acc-1',
      name: 'VIJAY SHIROYA',
      email: 'vijay.ca@policyai.com',
      firmName: 'VIJAY SHIROYA & Co. Chartered Accountants',
      role: 'Senior Accountant / Auditor'
    };
  });

  // AI Analysis Flow States
  const [analysisState, setAnalysisState] = useState<'idle' | 'processing' | 'review'>('idle');
  const [activeFileName, setActiveFileName] = useState('');
  const [activeFileType, setActiveFileType] = useState('');
  const [activeFileDataBase64, setActiveFileDataBase64] = useState<string | undefined>(undefined);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [batchItems, setBatchItems] = useState<BatchExtractionItem[]>([]);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentFileName: string; completedCount: number }>({
    current: 1,
    total: 1,
    currentFileName: '',
    completedCount: 0
  });
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Modals & UI States
  const [selectedPolicyForDetail, setSelectedPolicyForDetail] = useState<PolicyRecord | null>(null);
  const [duplicateCheckState, setDuplicateCheckState] = useState<{
    isDuplicate: boolean;
    existingPolicy: PolicyRecord | null;
    pendingData: Partial<PolicyRecord> | null;
  }>({ isDuplicate: false, existingPolicy: null, pendingData: null });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load Policies & Stats
  const loadData = useCallback(async () => {
    try {
      const pols = await fetchPolicies();
      setPolicies(pols);
      const st = await fetchDashboardStats();
      setStats(st);
    } catch (err) {
      console.warn('Boot load error, reading local fallback', err);
      const pols = getLocalPolicies();
      setPolicies(pols);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to real-time Firestore database policy updates
    const unsubscribe = subscribeToFirestorePolicies((firestorePols) => {
      if (firestorePols && firestorePols.length > 0) {
        setPolicies(firestorePols);
        
        // Recompute stats
        const totalPolicies = firestorePols.length;
        const activePolicies = firestorePols.filter(p => p.policyStatus === 'ACTIVE').length;
        const expiredPolicies = firestorePols.filter(p => p.policyStatus === 'EXPIRED').length;
        const expiringSoonPolicies = firestorePols.filter(p => p.policyStatus === 'EXPIRING SOON').length;
        const totalPremiumValue = firestorePols.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0);
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        const policiesAddedThisMonth = firestorePols.filter(p => p.createdAt && p.createdAt.startsWith(currentMonthStr)).length;

        setStats({
          totalPolicies,
          activePolicies,
          expiredPolicies,
          expiringSoonPolicies,
          totalPremiumValue,
          policiesAddedThisMonth
        });
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // AI Policy Document Bulk Analysis Trigger
  const handleAnalyzeBulk = async (files: QueueFileItem[], instruction: string) => {
    if (files.length === 0) return;

    setAnalysisState('processing');
    setBatchItems([]);
    const total = files.length;
    const completedResults: BatchExtractionItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      setBulkProgress({
        current: i + 1,
        total,
        currentFileName: item.file.name,
        completedCount: i
      });

      try {
        const result = await analyzePolicyDocument(item.fileBase64, item.file.name, item.file.type, instruction);
        completedResults.push({
          id: item.id,
          fileName: item.file.name,
          fileType: item.file.type,
          fileBase64: item.fileBase64,
          result
        });
      } catch (err: any) {
        console.error(`Error analyzing ${item.file.name}:`, err);
        showToast(`Failed to analyze "${item.file.name}"`, 'error');
      }
    }

    if (completedResults.length > 0) {
      setBatchItems(completedResults);
      setActiveFileName(completedResults[0].fileName);
      setActiveFileType(completedResults[0].fileType);
      setActiveFileDataBase64(completedResults[0].fileBase64);
      setExtractionResult(completedResults[0].result);
      setAnalysisState('review');
      showToast(`Bulk analysis completed! ${completedResults.length} of ${total} PDFs extracted.`, 'success');
    } else {
      setAnalysisState('idle');
      showToast('Batch analysis failed for all uploaded documents.', 'error');
    }
  };

  // AI Policy Document Single Analysis Trigger (Compatibility)
  const handleAnalyzePolicy = async (
    fileData: string | undefined,
    fileName: string,
    mimeType: string,
    instruction: string
  ) => {
    setActiveFileName(fileName);
    setActiveFileType(mimeType);
    setActiveFileDataBase64(fileData);
    setAnalysisState('processing');

    try {
      const result = await analyzePolicyDocument(fileData, fileName, mimeType, instruction);
      setExtractionResult(result);
      setBatchItems([{ id: 'single', fileName, fileType: mimeType, fileBase64: fileData, result }]);
      setAnalysisState('review');
      showToast('AI analysis completed successfully!', 'success');
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      showToast(err.message || 'Unable to analyze policy document. Please try again.', 'error');
      setAnalysisState('idle');
    }
  };

  // Save Batch Policies All at Once
  const handleSaveBatchPolicies = async (batchToSave: Partial<PolicyRecord>[]) => {
    setIsSavingPolicy(true);
    let savedCount = 0;

    try {
      for (const data of batchToSave) {
        await savePolicyRecord(data);
        savedCount++;
      }
      await loadData();

      setIsSavingPolicy(false);
      setAnalysisState('idle');
      setExtractionResult(null);
      setBatchItems([]);
      showToast(`Successfully saved ${savedCount} policies to database!`, 'success');
      setCurrentTab('policies');
    } catch (err: any) {
      console.error('Save batch error:', err);
      showToast('Failed to save some policies in batch', 'error');
      setIsSavingPolicy(false);
    }
  };

  // Save Extracted / Edited Policy
  const handleSaveExtractedPolicy = async (data: Partial<PolicyRecord>) => {
    setIsSavingPolicy(true);

    try {
      // Step 1: Duplicate policy check
      const dupCheck = await checkDuplicatePolicy(
        data.policyNumber || '',
        data.ownerName || '',
        data.phoneNumber || ''
      );

      if (dupCheck.isDuplicate && dupCheck.existingPolicy) {
        setIsSavingPolicy(false);
        setDuplicateCheckState({
          isDuplicate: true,
          existingPolicy: dupCheck.existingPolicy,
          pendingData: data
        });
        return;
      }

      // Step 2: Save to Database
      await commitSavePolicy(data);
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('Failed to save policy record', 'error');
      setIsSavingPolicy(false);
    }
  };

  const commitSavePolicy = async (data: Partial<PolicyRecord>) => {
    setIsSavingPolicy(true);
    try {
      const completeRecord: Partial<PolicyRecord> = {
        ...data,
        originalFileName: activeFileName || 'Policy_Document.pdf',
        fileType: activeFileType || 'application/pdf',
        documentUrl: activeFileDataBase64 || null,
        extractedText: extractionResult?.extractedText || data.extractedText || ''
      };

      if (activeFileDataBase64) {
        if (data.policyNumber) await storePdfFile(data.policyNumber, activeFileDataBase64);
      }

      await savePolicyRecord(completeRecord);
      await loadData();

      setIsSavingPolicy(false);
      setAnalysisState('idle');
      setExtractionResult(null);
      setDuplicateCheckState({ isDuplicate: false, existingPolicy: null, pendingData: null });
      showToast('Policy saved successfully under owner name!', 'success');
      setCurrentTab('policies');
    } catch (err: any) {
      showToast('Error persisting policy to database', 'error');
      setIsSavingPolicy(false);
    }
  };

  // Delete Policy
  const handleDeletePolicy = async (id: string) => {
    try {
      await deletePolicyRecord(id);
      await loadData();
      showToast('Policy deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete policy', 'error');
    }
  };

  // Update Policy
  const handleUpdatePolicy = async (updated: PolicyRecord) => {
    try {
      await updatePolicyRecord(updated.id, updated);
      await loadData();
      setSelectedPolicyForDetail(updated);
      showToast('Policy updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update policy', 'error');
    }
  };

  const expiringCount = policies.filter(p => p.policyStatus === 'EXPIRING SOON').length;

  return (
    <div className={`relative h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex antialiased selection:bg-indigo-500 selection:text-white overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Canvas Node Network Background */}
      <AiBackground />

      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'analyze' && analysisState === 'review') {
            // keep current review view
          } else if (tab === 'analyze') {
            setAnalysisState('idle');
          }
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        expiringCount={expiringCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Topbar
          user={user}
          policies={policies}
          onSelectPolicy={(policy) => setSelectedPolicyForDetail(policy)}
          onOpenAnalyze={() => {
            setCurrentTab('analyze');
            setAnalysisState('idle');
          }}
          onSelectTab={setCurrentTab}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                policies={policies}
                onOpenAnalyze={() => {
                  setCurrentTab('analyze');
                  setAnalysisState('idle');
                }}
                onSelectPolicy={(policy) => setSelectedPolicyForDetail(policy)}
                onSelectTab={setCurrentTab}
              />
            )}

            {currentTab === 'analyze' && (
              <>
                {analysisState === 'idle' && (
                  <ChatGPTAnalyzeBox
                    onAnalyzeBulk={handleAnalyzeBulk}
                    isLoading={false}
                  />
                )}

                {analysisState === 'processing' && (
                  <AIProcessingProgress
                    fileName={activeFileName}
                    bulkCurrent={bulkProgress.current}
                    bulkTotal={bulkProgress.total}
                    currentFileName={bulkProgress.currentFileName}
                    completedCount={bulkProgress.completedCount}
                  />
                )}

                {analysisState === 'review' && extractionResult && (
                  <ExtractionResultView
                    extraction={extractionResult}
                    fileName={activeFileName}
                    batchItems={batchItems}
                    onSave={handleSaveExtractedPolicy}
                    onSaveBatch={handleSaveBatchPolicies}
                    onCancel={() => setAnalysisState('idle')}
                    onUploadMore={() => setAnalysisState('idle')}
                    isSaving={isSavingPolicy}
                  />
                )}
              </>
            )}

            {currentTab === 'policies' && (
              <PoliciesListView
                policies={policies}
                onSelectPolicy={(policy) => setSelectedPolicyForDetail(policy)}
                onOpenAnalyze={() => {
                  setCurrentTab('analyze');
                  setAnalysisState('idle');
                }}
                onDeletePolicy={handleDeletePolicy}
              />
            )}

            {currentTab === 'clients' && (
              <ClientsCrmView
                policies={policies}
                onSelectPolicy={(policy) => setSelectedPolicyForDetail(policy)}
                onOpenAnalyze={() => {
                  setCurrentTab('analyze');
                  setAnalysisState('idle');
                }}
              />
            )}

            {currentTab === 'expiring' && (
              <ExpiringPoliciesView
                policies={policies}
                onSelectPolicy={(policy) => setSelectedPolicyForDetail(policy)}
                onOpenAnalyze={() => {
                  setCurrentTab('analyze');
                  setAnalysisState('idle');
                }}
              />
            )}

            {currentTab === 'commissions' && (
              <CommissionTrackerView
                policies={policies}
              />
            )}

            {currentTab === 'claims' && (
              <ClaimsIntimationView
                policies={policies}
              />
            )}

            {currentTab === 'security' && (
              <SecurityComplianceView />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                stats={stats}
                policies={policies}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                user={user}
                onUpdateUser={(updated) => {
                  setUser(updated);
                  try {
                    localStorage.setItem('policyai_user_profile', JSON.stringify(updated));
                  } catch (e) {
                    console.warn('Failed to store profile in localStorage', e);
                  }
                  showToast('Accountant profile updated', 'success');
                }}
              />
            )}
          </main>
        </div>

      {selectedPolicyForDetail && (
        <PolicyDetailModal
          policy={selectedPolicyForDetail}
          onClose={() => setSelectedPolicyForDetail(null)}
          onUpdate={handleUpdatePolicy}
          onDelete={handleDeletePolicy}
        />
      )}

      {duplicateCheckState.isDuplicate && duplicateCheckState.existingPolicy && duplicateCheckState.pendingData && (
        <DuplicateCheckModal
          existingPolicy={duplicateCheckState.existingPolicy}
          newPolicyData={duplicateCheckState.pendingData}
          onSaveAnyway={() => {
            const data = duplicateCheckState.pendingData!;
            setDuplicateCheckState({ isDuplicate: false, existingPolicy: null, pendingData: null });
            commitSavePolicy(data);
          }}
          onReviewExisting={(existing) => {
            setDuplicateCheckState({ isDuplicate: false, existingPolicy: null, pendingData: null });
            setSelectedPolicyForDetail(existing);
          }}
          onCancel={() => setDuplicateCheckState({ isDuplicate: false, existingPolicy: null, pendingData: null })}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
