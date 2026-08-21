import jsPDF from 'jspdf';
import { PolicyRecord } from '../types/index';
import { getPdfFile } from './pdfStorage';

/**
 * Downloads either the original uploaded PDF/image document file
 * or generates an official downloadable PDF file using jsPDF.
 * NEVER opens a print preview window or window.print().
 */
export const downloadPolicyPdf = async (policy: PolicyRecord) => {
  // 1. Check for original uploaded file in policy record or IndexedDB
  let docUrl = policy.documentUrl;
  
  if (!docUrl) {
    if (policy.id) {
      docUrl = await getPdfFile(policy.id);
    }
    if (!docUrl && policy.policyNumber) {
      docUrl = await getPdfFile(policy.policyNumber);
    }
  }

  if (docUrl && typeof docUrl === 'string') {
    let finalHref = docUrl;
    // Fix raw base64 string without data prefix
    if (!docUrl.startsWith('data:') && !docUrl.startsWith('http') && !docUrl.startsWith('blob:')) {
      finalHref = `data:application/pdf;base64,${docUrl}`;
    }

    const isPng = policy.fileType?.includes('png') || policy.originalFileName?.toLowerCase().endsWith('.png');
    const isJpg = policy.fileType?.includes('jpg') || policy.fileType?.includes('jpeg') || policy.originalFileName?.toLowerCase().endsWith('.jpg');
    const ext = isPng ? '.png' : isJpg ? '.jpg' : '.pdf';
    
    let cleanFileName = (policy.originalFileName || `Policy_${policy.policyNumber || 'Document'}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!cleanFileName.toLowerCase().endsWith(ext)) {
      cleanFileName += ext;
    }

    try {
      const link = document.createElement('a');
      link.href = finalHref;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    } catch (e) {
      console.warn('Direct download link failed, using PDF generator:', e);
    }
  }

  // 2. Generate and download a PDF file directly via jsPDF
  generateAndDownloadPdfDoc(policy);
};

function generateAndDownloadPdfDoc(policy: PolicyRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Top Title Banner
  doc.setFillColor(30, 27, 75); // #1e1b4b
  doc.rect(margin, 15, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('V SHIROYA INSURANCE', margin + 8, 25);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Verified e-Policy Audit Document', margin + 8, 32);

  // Status Badge
  doc.setFillColor(79, 70, 229); // Indigo #4f46e5
  doc.roundedRect(pageWidth - margin - 45, 20, 38, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text((policy.policyStatus || 'ACTIVE').toUpperCase(), pageWidth - margin - 26, 27.5, { align: 'center' });

  // Main Info Card Box
  let y = 46;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 60, 3, 3, 'FD');

  const col1 = margin + 6;
  const col2 = margin + (contentWidth / 2) + 4;

  const addGridItem = (label: string, value: string, x: number, currentY: number) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, currentY);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(value || 'N/A', x, currentY + 4.5);
  };

  addGridItem('Policyholder / Owner Name', policy.ownerName || 'N/A', col1, y + 8);
  addGridItem('Policy Number', `#${policy.policyNumber || 'N/A'}`, col2, y + 8);

  addGridItem('Insurer Company', policy.providerCompany || 'N/A', col1, y + 21);
  addGridItem('Policy Plan / Type', policy.policyType || 'N/A', col2, y + 21);

  addGridItem('Sum Assured / Insured', `INR ${(policy.sumAssured || 0).toLocaleString('en-IN')}`, col1, y + 34);
  addGridItem('Premium Amount', `INR ${(policy.premiumAmount || 0).toLocaleString('en-IN')} (${policy.premiumFrequency || 'Annual'})`, col2, y + 34);

  addGridItem('Policy Start Date', policy.startDate || 'N/A', col1, y + 47);
  addGridItem('Policy Expiry / End Date', policy.endDate || 'N/A', col2, y + 47);

  // Policy Schedule Table Section
  y = 114;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('Extracted Schedule & Policy Particulars', margin, y);

  y += 5;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PARAMETER', margin + 4, y + 5.5);
  doc.text('EXTRACTED DETAILS', margin + 65, y + 5.5);

  const tableRows: [string, string][] = [
    ['Covered Insured Person', policy.insuredPerson || policy.ownerName || 'N/A'],
    ['Nominee Name & Relationship', `${policy.nominee || 'N/A'} ${policy.nomineeRelationship ? `(${policy.nomineeRelationship})` : ''}`],
    ['Contact Phone Number', policy.phoneNumber || 'N/A'],
    ['Email Address', policy.email || 'N/A'],
    ['Payment Mode', policy.paymentMode || 'N/A'],
    ['Maturity Date', policy.maturityDate || 'N/A'],
    ['Agent / Representative', `${policy.agentName || 'V Shiroya Advisor'} ${policy.branchName ? `(${policy.branchName})` : ''}`],
  ];

  if (policy.additionalDetails && Array.isArray(policy.additionalDetails)) {
    policy.additionalDetails.forEach(item => {
      if (item.label && item.value) {
        tableRows.push([item.label, item.value]);
      }
    });
  }

  y += 8;
  tableRows.forEach(([param, val]) => {
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(param, margin + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, margin + 65, y + 5);

    y += 8;
  });

  // Footer
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 5, margin + contentWidth, footerY - 5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('V Shiroya Insurance Management System • IRDAI Data Compliant', margin, footerY);
  doc.text(`Downloaded: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin - 35, footerY);

  let cleanFileName = (policy.originalFileName || `Policy_${policy.policyNumber || 'Document'}`)
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!cleanFileName.toLowerCase().endsWith('.pdf')) {
    cleanFileName += '.pdf';
  }

  doc.save(cleanFileName);
}
