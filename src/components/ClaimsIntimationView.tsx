import React, { useState } from 'react';
import { 
  Send, 
  Mail, 
  CheckCircle2, 
  Copy, 
  Building2, 
  FileText, 
  AlertCircle, 
  User, 
  Phone, 
  Calendar, 
  DollarSign,
  Sparkles
} from 'lucide-react';
import { PolicyRecord } from '../types/index';
import { MotionWrapper } from './MotionWrapper';

interface ClaimsIntimationViewProps {
  policies: PolicyRecord[];
}

// Pre-configured claim emails for top Indian insurance companies
const INSURER_CLAIM_EMAILS: Record<string, string> = {
  'lic of india': 'claims@licindia.com',
  'hdfc ergo': 'claims@hdfcergo.com',
  'star health': 'support@starhealth.in',
  'icici prudential': 'lifeline@icicipruamc.com',
  'sbi life': 'claims@sbilife.co.in',
  'max life': 'claims.support@maxlifeinsurance.com',
  'care health': 'claims@careinsurance.com',
  'bajaj allianz': 'claims@bajajallianz.co.in',
  'tata aia': 'customercare@tataaia.com',
  'niva bupa': 'customercare@nivabupa.com',
  'oriental insurance': 'claims@orientalinsurance.co.in',
  'new india assurance': 'tech.claims@newindia.co.in'
};

export const ClaimsIntimationView: React.FC<ClaimsIntimationViewProps> = ({ policies }) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policies[0]?.id || '');
  const [claimType, setClaimType] = useState('Cashless Hospitalization');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [hospitalOrDetails, setHospitalOrDetails] = useState('Apollo Hospital, Main Branch / Incident Location');
  const [estimatedAmount, setEstimatedAmount] = useState('150000');
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [language, setLanguage] = useState<'en' | 'gu'>('en');

  const activePolicy = policies.find(p => p.id === selectedPolicyId) || policies[0];

  const generateEmailBody = (lang: 'en' | 'gu') => {
    if (!activePolicy) return '';
    
    if (lang === 'en') {
      return `To,
Claims Department,
${activePolicy.providerCompany}

SUBJECT: INTIAL CLAIM INTIMATION FOR POLICY NO: #${activePolicy.policyNumber}

Dear Claims Officer,

This is an official claim intimation notice regarding Policy #${activePolicy.policyNumber} managed under V Shiroya Insurance Portal.

POLICY & INSURED DETAILS:
- Policyholder Name: ${activePolicy.ownerName}
- Insured Person Name: ${activePolicy.insuredPerson || activePolicy.ownerName}
- Policy Number: #${activePolicy.policyNumber}
- Plan / Policy Type: ${activePolicy.policyType}
- Contact Phone: ${activePolicy.phoneNumber || 'N/A'}
- Contact Email: ${activePolicy.email || 'N/A'}

CLAIM INCIDENT DETAILS:
- Nature of Claim: ${claimType}
- Date of Incident / Admission: ${incidentDate}
- Hospital / Location / Garage Details: ${hospitalOrDetails}
- Estimated Claim Amount: ₹${parseInt(estimatedAmount || '0').toLocaleString('en-IN')}

Kindly acknowledge receipt of this intimation email and provide the Claim Registration Number along with required claim document submission guidelines at the earliest.

Sincerely,
${activePolicy.agentName || 'VIJAY SHIROYA (Certified Insurance Advisor)'}
V Shiroya Insurance CRM`;
    } else {
      return `પ્રતિ,
ક્લેમ્સ વિભાગ,
${activePolicy.providerCompany}

વિષય: પોલિસી નંબર: #${activePolicy.policyNumber} માટે પ્રારંભિક ક્લેમ ઇન્ટિમેશન

આદરણીય ક્લેમ્સ અધિકારી,

આ પોલિસી #${activePolicy.policyNumber} અંગેની સત્તાવાર ક્લેમ ઇન્ટિમેશન નોટિસ છે, જે V Shiroya Insurance Portal હેઠળ સંચાલિત છે.

પોલિસી અને વીમાધારકની વિગતો:
- પોલિસીધારકનું નામ: ${activePolicy.ownerName}
- વીમાધારક વ્યક્તિનું નામ: ${activePolicy.insuredPerson || activePolicy.ownerName}
- પોલિસી નંબર: #${activePolicy.policyNumber}
- પ્લાન/પોલિસી પ્રકાર: ${activePolicy.policyType}
- સંપર્ક ફોન: ${activePolicy.phoneNumber || 'N/A'}
- સંપર્ક ઇમેઇલ: ${activePolicy.email || 'N/A'}

ક્લેમની વિગતો:
- ક્લેમનો પ્રકાર: ${claimType}
- ઘટના/દાખલ થયાની તારીખ: ${incidentDate}
- હોસ્પિટલ/ગેરેજ/સ્થળની વિગતો: ${hospitalOrDetails}
- અંદાજિત ક્લેમ રકમ: ₹${parseInt(estimatedAmount || '0').toLocaleString('en-IN')}

કૃપા કરીને આ ઇમેઇલની પ્રાપ્તિ સ્વીકારો અને ક્લેમ નોંધણી નંબર તેમજ ક્લેમ ડોક્યુમેન્ટ સબમિશન માર્ગદર્શિકા વહેલી તકે પ્રદાન કરો.

આપનો વિશ્વાસુ,
${activePolicy.agentName || 'વિજય શિરોયા (સર્ટિફાઇડ ઇન્સ્યોરન્સ એડવાઇઝર)'}
V Shiroya Insurance CRM`;
    }
  };

  const emailBody = generateEmailBody(language);

  const getClaimEmail = (provider: string) => {
    const key = (provider || '').toLowerCase().trim();
    for (const [k, v] of Object.entries(INSURER_CLAIM_EMAILS)) {
      if (key.includes(k)) return v;
    }
    return `claims@${key.replace(/[^a-z0-9]/g, '') || 'insurer'}.com`;
  };

  const insurerEmail = activePolicy ? getClaimEmail(activePolicy.providerCompany) : 'claims@insurer.com';

  const emailSubject = activePolicy
    ? `URGENT CLAIM INTIMATION: Policy #${activePolicy.policyNumber} - ${activePolicy.ownerName}`
    : 'URGENT CLAIM INTIMATION';

  const handleWhatsAppEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phoneNumber.length === 10) {
      window.open(`https://wa.me/91${phoneNumber}?text=${encodeURIComponent(emailBody)}`, '_blank');
    }
  };

  const handleOpenWhatsApp = () => {
    if (phoneNumber.length === 10) {
      window.open(`https://wa.me/91${phoneNumber}?text=${encodeURIComponent(emailBody)}`, '_blank');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGmail = () => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(insurerEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(url, '_blank');
  };

  return (
    <MotionWrapper className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold mb-2">
              <Send className="w-3.5 h-3.5" /> V Shiroya Insurance Direct Claim Intimation Engine
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Direct Insurer Claim Intimation</h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Auto-generate official claim notifications to insurance company claim departments (LIC, Star Health, HDFC ERGO, ICICI Lombard) and send directly via Gmail.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Select Policy & Incident Info
          </h2>

          <div className="space-y-3 text-xs font-semibold">
            <div>
              <label className="text-slate-600 dark:text-slate-400 mb-1 block">Target Policy *</label>
              <select
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.ownerName} - #{p.policyNumber} ({p.providerCompany})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 mb-1 block">Claim Type *</label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl"
              >
                <option value="Cashless Hospitalization">Cashless Hospitalization</option>
                <option value="Reimbursement Medical Claim">Reimbursement Medical Claim</option>
                <option value="Vehicle Motor Accident / Own Damage">Vehicle Motor Accident / Own Damage</option>
                <option value="Death Claim / Life Insurance Intimation">Death Claim / Life Insurance Intimation</option>
                <option value="Critical Illness Benefit">Critical Illness Benefit</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 mb-1 block">Incident / Admission Date *</label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 mb-1 block">Hospital / Garage / Location Details *</label>
              <input
                type="text"
                value={hospitalOrDetails}
                onChange={(e) => setHospitalOrDetails(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 mb-1 block">Estimated Claim Amount (₹)</label>
              <input
                type="number"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl"
              />
            </div>
          </div>

          {activePolicy && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-100/80 dark:border-indigo-800/80 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
              <p className="font-extrabold flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Insurer Claims Contact
              </p>
              <p className="font-bold text-indigo-700 dark:text-indigo-300">{insurerEmail}</p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400">Auto-resolved official claims desk email for {activePolicy.providerCompany}</p>
            </div>
          )}
        </div>

        {/* Right Generated Preview & Action Box */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Generated Claims Intimation Notice
              </h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Text' : 'Copy Notice'}</span>
              </button>
            </div>

            <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[380px] border border-slate-800">
              {emailBody}
            </div>

            {/* Language Toggle Buttons */}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('gu')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  language === 'gu'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                ગુજરાતી
              </button>
            </div>

            {/* Copy button below notice box */}
            <div className="mt-2.5 flex items-center justify-between">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200/80 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Notice Text'}</span>
              </button>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Click to copy full text</span>
            </div>
          </div>

            {/* WhatsApp Intimation Box */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Quick WhatsApp Intimation</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={handleWhatsAppEnter}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
                <button
                  onClick={handleOpenWhatsApp}
                  disabled={phoneNumber.length !== 10}
                  className="px-3 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  Send to WA
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Compliant with IRDAI Claim Intimation Timelines
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenGmail}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Direct Send via Gmail
              </button>
            </div>
          </div>
        </div>
      </div>
    </MotionWrapper>
  );
};
