import { PolicyRecord, DashboardStats, SecurityAuditLog, ExtractionResult } from '../types/index';
import { initialPolicies } from '../data/initialPolicies';
import {
  fetchFirestorePolicies, saveFirestorePolicy, updateFirestorePolicy,
  deleteFirestorePolicy, updateFirestoreProfile
} from './firebase';

export {
  fetchFirestorePolicies, saveFirestorePolicy, updateFirestorePolicy,
  deleteFirestorePolicy, updateFirestoreProfile
};

const STORAGE_KEY = 'policyai_stored_policies';
// Firebase Hosting serves index.html for unknown relative routes. API calls must
// therefore use the Render origin directly instead of /api/... on this site.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://v-shiroya-policy.onrender.com').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

async function readJsonResponse(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {
    if (contentType.includes('text/html') || /^\s*<!doctype|^\s*<html/i.test(text)) {
      throw new Error(`Backend returned HTML instead of JSON (HTTP ${response.status}). Check the Render API URL.`);
    }
    throw new Error(`Backend returned invalid JSON (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(data?.error || data?.details || `Backend HTTP ${response.status}`);
  return data;
}

export function getLocalPolicies(): PolicyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.error('Error reading localStorage policies:', e); }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPolicies));
  return initialPolicies;
}

export function saveLocalPolicies(policies: PolicyRecord[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(policies)); }
  catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(policies.map(p => ({ ...p, documentUrl: p.documentUrl && p.documentUrl.length > 200000 ? null : p.documentUrl }))));
    } catch (e) { console.error('Error saving localStorage policies:', e); }
  }
}

export async function fetchPolicies(query = '', status = 'ALL', provider = 'ALL'): Promise<PolicyRecord[]> {
  let list: PolicyRecord[] = [];
  try {
    const firestorePols = await fetchFirestorePolicies();
    if (firestorePols?.length) { list = firestorePols; saveLocalPolicies(list); }
    else list = getLocalPolicies();
  } catch {
    try {
      const url = new URL(apiUrl('/api/policies'));
      if (query) url.searchParams.set('q', query);
      if (status !== 'ALL') url.searchParams.set('status', status);
      if (provider !== 'ALL') url.searchParams.set('provider', provider);
      const data = await readJsonResponse(await fetch(url));
      list = data.policies || [];
      if (list.length) saveLocalPolicies(list);
    } catch { list = getLocalPolicies(); }
  }
  if (!list.length) list = getLocalPolicies();
  if (query) { const q = query.toLowerCase(); list = list.filter(p => [p.ownerName,p.policyNumber,p.phoneNumber,p.providerCompany,p.policyType,p.category].some(v => String(v || '').toLowerCase().includes(q))); }
  if (status !== 'ALL') list = list.filter(p => p.policyStatus === status);
  if (provider !== 'ALL') list = list.filter(p => p.providerCompany === provider);
  return list;
}

export async function analyzePolicyDocument(fileData: string | undefined, fileName: string, mimeType: string, instruction: string): Promise<ExtractionResult> {
  try {
    const data = await readJsonResponse(await fetch(apiUrl('/api/analyze-policy'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, fileName, mimeType, instruction })
    }));
    if (!data?.extraction) throw new Error('AI analysis server returned an invalid response structure.');
    return data.extraction;
  } catch (err: any) {
    console.error('Error in analyzePolicyDocument:', err);
    throw new Error(err.message || 'Unable to connect to AI analysis backend server.');
  }
}

export async function checkDuplicatePolicy(policyNumber: string, ownerName: string, phoneNumber: string): Promise<{ isDuplicate: boolean; existingPolicy: PolicyRecord | null }> {
  try {
    const data = await readJsonResponse(await fetch(apiUrl('/api/policies/check-duplicate'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({policyNumber,ownerName,phoneNumber}) }));
    return data;
  } catch {
    const dup = getLocalPolicies().find(p => (policyNumber && p.policyNumber.toLowerCase().trim() === policyNumber.toLowerCase().trim()) || (ownerName && phoneNumber && p.ownerName.toLowerCase().trim() === ownerName.toLowerCase().trim() && p.phoneNumber === phoneNumber));
    return { isDuplicate: !!dup, existingPolicy: dup || null };
  }
}

function normalizePolicy(policy: Partial<PolicyRecord>): PolicyRecord {
  return {
    id: policy.id || `pol-${Date.now()}`, ownerName: policy.ownerName || 'Unknown Owner', policyNumber: policy.policyNumber || 'UNASSIGNED', providerCompany: policy.providerCompany || 'Unspecified Provider', policyType: policy.policyType || 'General Policy', category: policy.category || 'General', startDate: policy.startDate || null, endDate: policy.endDate || null, premiumAmount: policy.premiumAmount ?? null, premiumFrequency: policy.premiumFrequency || 'Annual', sumAssured: policy.sumAssured ?? null, insuredPerson: policy.insuredPerson || policy.ownerName || null, nominee: policy.nominee || null, nomineeRelationship: policy.nomineeRelationship || null, phoneNumber: policy.phoneNumber || null, email: policy.email || null, address: policy.address || null, dateOfBirth: policy.dateOfBirth || null, agentName: policy.agentName || null, agentPhone: policy.agentPhone || null, branchName: policy.branchName || null, paymentMode: policy.paymentMode || null, policyStatus: policy.policyStatus || 'ACTIVE', maturityDate: policy.maturityDate || null, documentUrl: policy.documentUrl || null, originalFileName: policy.originalFileName || 'policy_document.pdf', fileSizeBytes: policy.fileSizeBytes || 0, fileType: policy.fileType || 'application/pdf', extractedText: policy.extractedText || '', aiConfidence: policy.aiConfidence || 95, createdAt: policy.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), userId: policy.userId || 'acc-1', additionalDetails: policy.additionalDetails || [], missingFields: policy.missingFields || [], uncertainFields: policy.uncertainFields || [], fieldConfidenceMap: policy.fieldConfidenceMap || {}
  };
}

export async function savePolicyRecord(policy: Partial<PolicyRecord>): Promise<PolicyRecord> {
  const record = normalizePolicy(policy);
  try { await saveFirestorePolicy(record); } catch {}
  try { await fetch(apiUrl('/api/policies'), {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)}); } catch {}
  const list = getLocalPolicies(); const i = list.findIndex(p => p.id === record.id); if (i >= 0) list[i] = record; else list.unshift(record); saveLocalPolicies(list); return record;
}

export async function updatePolicyRecord(id: string, updates: Partial<PolicyRecord>): Promise<PolicyRecord> {
  const list = getLocalPolicies(); const idx = list.findIndex(p => p.id === id); const record = normalizePolicy(idx >= 0 ? {...list[idx], ...updates, updatedAt:new Date().toISOString()} : {...updates,id});
  try { await updateFirestorePolicy(id, updates); } catch {}
  try { await fetch(apiUrl(`/api/policies/${id}`), {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(updates)}); } catch {}
  if (idx >= 0) { list[idx] = record; saveLocalPolicies(list); } return record;
}

export async function deletePolicyRecord(id: string): Promise<boolean> {
  try { await deleteFirestorePolicy(id); } catch {}
  try { await fetch(apiUrl(`/api/policies/${id}`), {method:'DELETE'}); } catch {}
  saveLocalPolicies(getLocalPolicies().filter(p => p.id !== id)); return true;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    return await readJsonResponse(await fetch(apiUrl('/api/stats')));
  } catch (err) {
    console.warn('Stats API failed, computing locally', err);
    const p = getLocalPolicies(); const currentMonth = new Date().toISOString().slice(0,7);
    return { totalPolicies:p.length, activePolicies:p.filter(x=>x.policyStatus==='ACTIVE').length, expiredPolicies:p.filter(x=>x.policyStatus==='EXPIRED').length, expiringSoonPolicies:p.filter(x=>x.policyStatus==='EXPIRING SOON').length, totalPremiumValue:p.reduce((s,x)=>s+(Number(x.premiumAmount)||0),0), policiesAddedThisMonth:p.filter(x=>x.createdAt?.startsWith(currentMonth)).length };
  }
}

export interface NotificationAlertResult { success:boolean; message:string; countSent:number; alerts:any[]; }
export async function dispatch30DayExpiryAlerts(policyIds?: string[], channel:'EMAIL'|'WHATSAPP'|'SMS'='EMAIL', customMessage?: string): Promise<NotificationAlertResult> {
  try { return await readJsonResponse(await fetch(apiUrl('/api/notifications/send-alert'), {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({policyIds,channel,customMessage})})); }
  catch { return {success:false,message:'Notification backend is unavailable.',countSent:0,alerts:[]}; }
}

export async function fetchSecurityAuditLogs(): Promise<SecurityAuditLog[]> {
  try { const data = await readJsonResponse(await fetch(apiUrl('/api/security/audit'))); return data.logs || []; }
  catch { return [{ id:'sec-1', timestamp:new Date().toISOString(), action:'SYSTEM_INITIALIZED', actor:'V SHIROYA AI', details:'PolicyAI local security audit store active.', ipAddress:'127.0.0.1' }]; }
}
