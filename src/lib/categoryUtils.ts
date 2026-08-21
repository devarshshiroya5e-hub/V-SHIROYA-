import { PolicyRecord } from '../types/index';

export type PolicyCategoryType = 'Life' | 'Health' | 'Vehicle' | 'Fire' | 'Travel' | 'General';

/**
 * Automated Policy Categorization logic
 * Examines policyType, providerCompany, extractedText, and additionalDetails
 * to detect and tag the canonical policy category.
 */
export function detectPolicyCategory(policy: Partial<PolicyRecord> | Record<string, any>): PolicyCategoryType {
  if (!policy || typeof policy !== 'object') return 'General';

  const pType = (policy.policyType || '').toLowerCase();
  const provider = (policy.providerCompany || '').toLowerCase();
  const text = (policy.extractedText || '').toLowerCase();
  const owner = (policy.ownerName || '').toLowerCase();
  const pNum = (policy.policyNumber || '').toLowerCase();

  let detailsStr = '';
  if (Array.isArray(policy.additionalDetails)) {
    detailsStr = policy.additionalDetails
      .map((d: any) => `${d.label || ''} ${d.value || ''}`)
      .join(' ')
      .toLowerCase();
  }

  const haystack = `${pType} ${provider} ${detailsStr} ${text} ${owner} ${pNum}`;

  // 1. Vehicle / Motor
  if (
    haystack.includes('vehicle') ||
    haystack.includes('motor') ||
    haystack.includes(' car ') ||
    haystack.includes('bike') ||
    haystack.includes('two wheeler') ||
    haystack.includes('chassis') ||
    haystack.includes('engine no') ||
    haystack.includes('reg no') ||
    haystack.includes('registration no') ||
    haystack.includes('third party') ||
    haystack.includes('own damage') ||
    haystack.includes('idv') ||
    haystack.includes('auto insurance')
  ) {
    return 'Vehicle';
  }

  // 2. Health
  if (
    haystack.includes('health') ||
    haystack.includes('mediclaim') ||
    haystack.includes('floater') ||
    haystack.includes('hospital') ||
    haystack.includes('optima') ||
    haystack.includes('care health') ||
    haystack.includes('niva bupa') ||
    haystack.includes('star health') ||
    haystack.includes('critical illness') ||
    haystack.includes('cashless') ||
    haystack.includes('room rent') ||
    haystack.includes('pre-existing')
  ) {
    return 'Health';
  }

  // 3. Fire / Property
  if (
    haystack.includes('fire') ||
    haystack.includes('property') ||
    haystack.includes('shopkeeper') ||
    haystack.includes('dwelling') ||
    haystack.includes('burglary') ||
    haystack.includes('building') ||
    haystack.includes('material damage') ||
    haystack.includes('home insurance') ||
    haystack.includes('asset protection')
  ) {
    return 'Fire';
  }

  // 4. Life
  if (
    haystack.includes('life') ||
    haystack.includes('term') ||
    haystack.includes('jeevan') ||
    haystack.includes('endowment') ||
    haystack.includes('ulip') ||
    haystack.includes('pension') ||
    haystack.includes('annuity') ||
    haystack.includes('death benefit') ||
    haystack.includes('lic') ||
    haystack.includes('sbi life') ||
    haystack.includes('max life') ||
    haystack.includes('icici pru') ||
    haystack.includes('tata aia') ||
    haystack.includes('smart wealth') ||
    haystack.includes('guaranteed income')
  ) {
    return 'Life';
  }

  // 5. Travel
  if (
    haystack.includes('travel') ||
    haystack.includes('trip') ||
    haystack.includes('passport') ||
    haystack.includes('overseas')
  ) {
    return 'Travel';
  }

  return 'General';
}

/**
 * Ensures a policy object has a valid category tag
 */
export function getPolicyCategory(policy: PolicyRecord): PolicyCategoryType {
  if (policy.category && ['Life', 'Health', 'Vehicle', 'Fire', 'Travel', 'General'].includes(policy.category)) {
    return policy.category as PolicyCategoryType;
  }
  return detectPolicyCategory(policy);
}

/**
 * Returns Tailwind badge styling for category tags
 */
export function getCategoryBadgeStyle(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Life':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'Health':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Vehicle':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'Fire':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'Travel':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
