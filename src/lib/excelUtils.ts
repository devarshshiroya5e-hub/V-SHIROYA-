import { PolicyRecord } from '../types/index';

/**
 * Escapes CSV special characters (commas, quotes, newlines) for clean Excel opening
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Formats currency values in INR for Excel display
 */
function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `₹${Number(val).toLocaleString('en-IN')}`;
}

/**
 * Download a single policy's detailed information as an Excel sheet (.csv format with UTF-8 BOM)
 */
export function downloadSinglePolicyExcel(policy: Partial<PolicyRecord>, customFilename?: string): void {
  const ownerName = policy.ownerName || 'Client';
  const policyNum = policy.policyNumber || 'Draft';
  const filename = customFilename || `${ownerName.replace(/[^a-zA-Z0-9]/g, '_')}_Policy_${policyNum}_Details.csv`;

  // Build key-value sections for Excel
  const rows: string[][] = [
    ['V SHIROYA INSURANCE - POLICY AUDIT REPORT & DETAILS'],
    ['Generated Date', new Date().toLocaleString()],
    ['Report Type', 'Single Policy Audit & Detail Worksheet'],
    [''], // blank line separator
    ['SECTION 1: POLICY & PROVIDER INFORMATION'],
    ['Field Name', 'Field Value'],
    ['Policy Number', policy.policyNumber || 'N/A'],
    ['Insurance Provider / Company', policy.providerCompany || 'N/A'],
    ['Policy Plan Type', policy.policyType || 'N/A'],
    ['Policy Category', policy.category || 'N/A'],
    ['Policy Current Status', policy.policyStatus || 'ACTIVE'],
    [''],
    ['SECTION 2: COVERAGE & FINANCIAL DETAILS'],
    ['Field Name', 'Field Value'],
    ['Annual / Premium Amount', formatCurrency(policy.premiumAmount)],
    ['Sum Assured / Insured Value', formatCurrency(policy.sumAssured)],
    ['Premium Payment Frequency', policy.premiumFrequency || 'N/A'],
    ['Payment Mode', policy.paymentMode || 'N/A'],
    ['Policy Start Date', policy.startDate || 'N/A'],
    ['Policy Expiry / Maturity Date', policy.endDate || 'N/A'],
    ['Maturity Date', policy.maturityDate || 'N/A'],
    [''],
    ['SECTION 3: INSURED & NOMINEE INFORMATION'],
    ['Field Name', 'Field Value'],
    ['Policy Owner / Proposer', policy.ownerName || 'N/A'],
    ['Insured Person Name', policy.insuredPerson || policy.ownerName || 'N/A'],
    ['Date of Birth', policy.dateOfBirth || 'N/A'],
    ['Nominee Name', policy.nominee || 'N/A'],
    ['Nominee Relationship', policy.nomineeRelationship || 'N/A'],
    [''],
    ['SECTION 4: CONTACT & AGENT DETAILS'],
    ['Field Name', 'Field Value'],
    ['Phone Number', policy.phoneNumber || 'N/A'],
    ['Email Address', policy.email || 'N/A'],
    ['Residential / Communication Address', policy.address || 'N/A'],
    ['Assigned Agent Name', policy.agentName || 'V Shiroya Advisor'],
    ['Agent Phone Number', policy.agentPhone || 'N/A'],
    ['Servicing Branch Name', policy.branchName || 'Main Office'],
    [''],
    ['SECTION 5: ADDITIONAL EXTRACTED METADATA'],
    ['Field Name', 'Field Value']
  ];

  if (policy.additionalDetails && Array.isArray(policy.additionalDetails) && policy.additionalDetails.length > 0) {
    policy.additionalDetails.forEach(item => {
      rows.push([item.label || 'Detail', String(item.value || '')]);
    });
  } else {
    rows.push(['Additional Field Notes', 'No secondary rider notes recorded']);
  }

  rows.push(['']);
  rows.push(['System Audit Timestamp', new Date().toISOString()]);
  rows.push(['Verification Disclaimer', 'Verified by V Shiroya Insurance Portal - IRDAI Data Compliant Record']);

  // Convert to CSV with UTF-8 BOM so Excel opens with proper encoding
  const csvContent = '\uFEFF' + rows.map(r => r.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download multiple or all policies as a structured Excel table (.csv with UTF-8 BOM)
 */
export function downloadPoliciesBulkExcel(policies: PolicyRecord[], customFilename?: string): void {
  const filename = customFilename || `V_Shiroya_Insurance_Policies_Export_${new Date().toISOString().slice(0, 10)}.csv`;

  const headers = [
    'Policy ID',
    'Policy Number',
    'Owner / Proposer Name',
    'Insurance Provider',
    'Policy Type / Plan',
    'Category',
    'Policy Status',
    'Premium Amount (₹)',
    'Sum Assured (₹)',
    'Payment Mode',
    'Start Date',
    'End Date',
    'Nominee Name',
    'Nominee Relation',
    'Phone Number',
    'Email Address',
    'Agent Name',
    'Branch Name',
    'Created Date'
  ];

  const dataRows = policies.map(p => [
    p.id,
    p.policyNumber,
    p.ownerName,
    p.providerCompany,
    p.policyType,
    p.category || 'General',
    p.policyStatus,
    p.premiumAmount !== null && p.premiumAmount !== undefined ? p.premiumAmount : '',
    p.sumAssured !== null && p.sumAssured !== undefined ? p.sumAssured : '',
    p.paymentMode || '',
    p.startDate || '',
    p.endDate || '',
    p.nominee || '',
    p.nomineeRelationship || '',
    p.phoneNumber || '',
    p.email || '',
    p.agentName || 'V Shiroya Advisor',
    p.branchName || 'Main Office',
    p.createdAt || ''
  ]);

  // Add Summary / Total Row
  const totalPremium = policies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0);
  const totalSumAssured = policies.reduce((sum, p) => sum + (Number(p.sumAssured) || 0), 0);

  const summaryRow = [
    'TOTALS',
    `Total Count: ${policies.length}`,
    '',
    '',
    '',
    '',
    '',
    totalPremium,
    totalSumAssured,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ];

  const allRows = [
    ['V SHIROYA INSURANCE PORTAL - POLICIES MASTER EXCEL SHEET'],
    [`Export Date: ${new Date().toLocaleString()}`, `Total Policy Records: ${policies.length}`],
    [''],
    headers,
    ...dataRows,
    [''],
    summaryRow
  ];

  const csvContent = '\uFEFF' + allRows.map(r => r.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
