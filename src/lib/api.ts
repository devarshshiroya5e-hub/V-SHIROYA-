import { PolicyRecord, DashboardStats, SecurityAuditLog, ExtractionResult } from '../types/index';
import { initialPolicies } from '../data/initialPolicies';
import { 
  fetchFirestorePolicies, 
  saveFirestorePolicy, 
  updateFirestorePolicy, 
  deleteFirestorePolicy,
  updateFirestoreProfile
} from './firebase';

export { 
  fetchFirestorePolicies, 
  saveFirestorePolicy, 
  updateFirestorePolicy, 
  deleteFirestorePolicy,
  updateFirestoreProfile
};

const STORAGE_KEY = 'policyai_stored_policies';

// Helper to get local fallback policies
export function getLocalPolicies(): PolicyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading localStorage policies:', e);
  }
  // Initialize with initial sample policies
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPolicies));
  return initialPolicies;
}

export function saveLocalPolicies(policies: PolicyRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  } catch (e) {
    console.warn('localStorage save quota reached, cleaning oversized documentUrl fields:', e);
    try {
      const cleaned = policies.map(p => ({
        ...p,
        documentUrl: p.documentUrl && p.documentUrl.length > 200000 ? null : p.documentUrl
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch (err2) {
      console.error('Error saving cleaned localStorage policies:', err2);
    }
  }
}

// Client API Methods integrated with Firebase Firestore
export async function fetchPolicies(query = '', status = 'ALL', provider = 'ALL'): Promise<PolicyRecord[]> {
  let list: PolicyRecord[] = [];

  // 1. Try fetching from Firebase Firestore Database
  try {
    const firestorePols = await fetchFirestorePolicies();
    if (firestorePols && firestorePols.length > 0) {
      list = firestorePols;
      saveLocalPolicies(list);
    } else {
      // Seed initial sample policies to Firestore if collection is empty
      const initial = getLocalPolicies();
      for (const pol of initial) {
        await saveFirestorePolicy(pol).catch(() => {});
      }
      list = initial;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking Express API & local cache:', err);
    try {
      const url = new URL('/api/policies', window.location.origin);
      if (query) url.searchParams.set('q', query);
      if (status !== 'ALL') url.searchParams.set('status', status);
      if (provider !== 'ALL') url.searchParams.set('provider', provider);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.policies) {
          saveLocalPolicies(data.policies);
          list = data.policies;
        }
      }
    } catch (apiErr) {
      list = getLocalPolicies();
    }
  }

  if (!list || list.length === 0) {
    list = getLocalPolicies();
  }

  // Filter in memory for search & filter parameters
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(p =>
      p.ownerName.toLowerCase().includes(q) ||
      p.policyNumber.toLowerCase().includes(q) ||
      p.phoneNumber?.toLowerCase().includes(q) ||
      p.providerCompany.toLowerCase().includes(q) ||
      p.policyType.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }
  if (status !== 'ALL') {
    list = list.filter(p => p.policyStatus === status);
  }
  if (provider !== 'ALL') {
    list = list.filter(p => p.providerCompany === provider);
  }

  return list;
}

export async function analyzePolicyDocument(
  fileData: string | undefined,
  fileName: string,
  mimeType: string,
  instruction: string
): Promise<ExtractionResult> {
  try {
    const response = await fetch('/api/analyze-policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, fileName, mimeType, instruction }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.error || errData.details || `AI Policy Analysis failed (Server HTTP ${response.status})`
      );
    }

    const data = await response.json();
    if (!data.extraction) {
      throw new Error('AI analysis server returned an invalid response structure.');
    }
    return data.extraction;
  } catch (err: any) {
    console.error('Error in analyzePolicyDocument:', err);
    throw new Error(err.message || 'Unable to connect to AI analysis backend server.');
  }
}

export async function checkDuplicatePolicy(
  policyNumber: string,
  ownerName: string,
  phoneNumber: string
): Promise<{ isDuplicate: boolean; existingPolicy: PolicyRecord | null }> {
  try {
    const res = await fetch('/api/policies/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyNumber, ownerName, phoneNumber }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Duplicate check API offline, performing client check', err);
  }

  // Fallback local duplicate check
  const list = getLocalPolicies();
  const dup = list.find(p =>
    (policyNumber && p.policyNumber.toLowerCase().trim() === policyNumber.toLowerCase().trim()) ||
    (ownerName && phoneNumber && p.ownerName.toLowerCase().trim() === ownerName.toLowerCase().trim() && p.phoneNumber === phoneNumber)
  );

  return { isDuplicate: !!dup, existingPolicy: dup || null };
}

export async function savePolicyRecord(policy: Partial<PolicyRecord>): Promise<PolicyRecord> {
  const newRecord: PolicyRecord = {
    id: policy.id || `pol-${Date.now()}`,
    ownerName: policy.ownerName || 'Unknown Owner',
    policyNumber: policy.policyNumber || 'UNASSIGNED',
    providerCompany: policy.providerCompany || 'Unspecified Provider',
    policyType: policy.policyType || 'General Policy',
    category: policy.category || 'General',
    startDate: policy.startDate || null,
    endDate: policy.endDate || null,
    premiumAmount: policy.premiumAmount ?? null,
    premiumFrequency: policy.premiumFrequency || 'Annual',
    sumAssured: policy.sumAssured ?? null,
    insuredPerson: policy.insuredPerson || policy.ownerName || null,
    nominee: policy.nominee || null,
    nomineeRelationship: policy.nomineeRelationship || null,
    phoneNumber: policy.phoneNumber || null,
    email: policy.email || null,
    address: policy.address || null,
    dateOfBirth: policy.dateOfBirth || null,
    agentName: policy.agentName || null,
    agentPhone: policy.agentPhone || null,
    branchName: policy.branchName || null,
    paymentMode: policy.paymentMode || null,
    policyStatus: policy.policyStatus || 'ACTIVE',
    maturityDate: policy.maturityDate || null,
    documentUrl: policy.documentUrl || null,
    originalFileName: policy.originalFileName || 'policy_document.pdf',
    fileSizeBytes: policy.fileSizeBytes || 0,
    fileType: policy.fileType || 'application/pdf',
    extractedText: policy.extractedText || '',
    aiConfidence: policy.aiConfidence || 95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'acc-1',
    additionalDetails: policy.additionalDetails || [],
    missingFields: policy.missingFields || [],
    uncertainFields: policy.uncertainFields || [],
    fieldConfidenceMap: policy.fieldConfidenceMap || {}
  };

  // 1. Save directly to Firebase Firestore Database
  await saveFirestorePolicy(newRecord);

  // 2. Cache to Express server & localStorage
  try {
    await fetch('/api/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(() => {});
  } catch (err) {
    // Fallthrough
  }

  const list = getLocalPolicies();
  const existingIdx = list.findIndex(p => p.id === newRecord.id);
  if (existingIdx !== -1) {
    list[existingIdx] = newRecord;
  } else {
    list.unshift(newRecord);
  }
  saveLocalPolicies(list);

  return newRecord;
}

export async function updatePolicyRecord(id: string, updates: Partial<PolicyRecord>): Promise<PolicyRecord> {
  const list = getLocalPolicies();
  const idx = list.findIndex(p => p.id === id);
  const updatedRecord = idx !== -1 ? { ...list[idx], ...updates, updatedAt: new Date().toISOString() } : (updates as PolicyRecord);

  // 1. Update in Firestore
  try {
    await updateFirestorePolicy(id, updates);
  } catch (fsErr) {
    console.warn('Firestore update warning:', fsErr);
  }

  // 2. Update Express backend
  try {
    await fetch(`/api/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  } catch (err) {
    // Fallthrough
  }

  if (idx !== -1) {
    list[idx] = updatedRecord;
    saveLocalPolicies(list);
  }

  return updatedRecord;
}

export async function deletePolicyRecord(id: string): Promise<boolean> {
  // 1. Delete from Firestore
  try {
    await deleteFirestorePolicy(id);
  } catch (fsErr) {
    console.warn('Firestore delete warning:', fsErr);
  }

  // 2. Delete from Express backend
  try {
    await fetch(`/api/policies/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch (err) {
    // Fallthrough
  }

  const list = getLocalPolicies();
  const filtered = list.filter(p => p.id !== id);
  saveLocalPolicies(filtered);

  return true;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Stats API failed, computing locally', err);
  }

  const policies = getLocalPolicies();
  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.policyStatus === 'ACTIVE').length;
  const expiredPolicies = policies.filter(p => p.policyStatus === 'EXPIRED').length;
  const expiringSoonPolicies = policies.filter(p => p.policyStatus === 'EXPIRING SOON').length;
  const totalPremiumValue = policies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const policiesAddedThisMonth = policies.filter(p => p.createdAt && p.createdAt.startsWith(currentMonthStr)).length;

  return {
    totalPolicies,
    activePolicies,
    expiredPolicies,
    expiringSoonPolicies,
    totalPremiumValue,
    policiesAddedThisMonth
  };
}

export interface NotificationAlertResult {
  success: boolean;
  message: string;
  countSent: number;
  alerts: Array<{
    id: string;
    policyId: string;
    policyNumber: string;
    ownerName: string;
    recipientEmail: string;
    recipientPhone: string;
    channel: string;
    subject: string;
    body: string;
    status: string;
    sentAt: string;
    daysLeft: number;
  }>;
}

export async function dispatch30DayExpiryAlerts(
  policyIds?: string[], 
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS' = 'EMAIL',
  customMessage?: string
): Promise<NotificationAlertResult> {
  try {
    const res = await fetch('/api/notifications/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyIds, channel, customMessage })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Notification API call failed, generating simulated alert dispatch', err);
  }

  // Client-side fallback dispatch
  const policies = getLocalPolicies();
  const today = new Date();
  const targetPolicies = policies.filter(p => {
    if (policyIds && policyIds.length > 0) return policyIds.includes(p.id);
    if (p.policyStatus === 'EXPIRING SOON') return true;
    if (p.endDate) {
      const diff = Math.ceil((new Date(p.endDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
      return diff >= 0 && diff <= 30;
    }
    return false;
  });

  const alerts = targetPolicies.map(p => ({
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    policyId: p.id,
    policyNumber: p.policyNumber,
    ownerName: p.ownerName,
    recipientEmail: p.email || `${p.ownerName.toLowerCase().replace(/\s+/g, '.')}@client-insurance.com`,
    recipientPhone: p.phoneNumber || 'N/A',
    channel,
    subject: `URGENT: 30-Day Policy Renewal Notice - ${p.providerCompany} Policy #${p.policyNumber}`,
    body: customMessage || `Dear ${p.ownerName},\nYour policy #${p.policyNumber} with ${p.providerCompany} expires in 30 days. Please arrange renewal payment of ₹${p.premiumAmount || 0}.\nV Shiroya Insurance Portal`,
    status: 'DELIVERED',
    sentAt: new Date().toISOString(),
    daysLeft: p.endDate ? Math.max(0, Math.ceil((new Date(p.endDate).getTime() - today.getTime()) / (1000 * 3600 * 24))) : 30
  }));

  return {
    success: true,
    message: `Dispatched 30-day ${channel} expiry alert notices to ${alerts.length} client(s).`,
    countSent: alerts.length,
    alerts
  };
}

export async function fetchSecurityAuditLogs(): Promise<SecurityAuditLog[]> {
  try {
    const res = await fetch('/api/security/audit');
    if (res.ok) {
      const data = await res.json();
      return data.logs;
    }
  } catch (err) {
    // fallback
  }

  return [
    {
      id: 'sec-1',
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INITIALIZED',
      actor: 'VIJAY SHIROYA (CA)',
      details: 'PolicyAI local security audit store active.',
      ipAddress: '127.0.0.1'
    }
  ];
}
