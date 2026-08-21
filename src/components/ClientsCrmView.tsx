import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  Plus, 
  FileText, 
  Download, 
  Upload, 
  UserCheck, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { PolicyRecord } from '../types/index';

interface ClientsCrmViewProps {
  policies: PolicyRecord[];
  onSelectPolicy: (policy: PolicyRecord) => void;
  onOpenAnalyze: () => void;
}

interface ClientGroup {
  name: string;
  phone: string;
  email: string;
  address: string;
  policies: PolicyRecord[];
  totalPremium: number;
  totalSumAssured: number;
  primaryProvider: string;
}

export const ClientsCrmView: React.FC<ClientsCrmViewProps> = ({
  policies,
  onSelectPolicy,
  onOpenAnalyze
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientGroup | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '' });

  // Group policies by client owner name
  const clientGroups = useMemo(() => {
    const map = new Map<string, ClientGroup>();

    policies.forEach((policy) => {
      const key = (policy.ownerName || 'Unknown Client').trim().toLowerCase();
      
      if (!map.has(key)) {
        map.set(key, {
          name: policy.ownerName || 'Unknown Client',
          phone: policy.phoneNumber || 'N/A',
          email: policy.email || 'N/A',
          address: policy.address || 'N/A',
          policies: [policy],
          totalPremium: policy.premiumAmount || 0,
          totalSumAssured: policy.sumAssured || 0,
          primaryProvider: policy.providerCompany || 'N/A'
        });
      } else {
        const existing = map.get(key)!;
        existing.policies.push(policy);
        existing.totalPremium += policy.premiumAmount || 0;
        existing.totalSumAssured += policy.sumAssured || 0;
        if (policy.phoneNumber && existing.phone === 'N/A') existing.phone = policy.phoneNumber;
        if (policy.email && existing.email === 'N/A') existing.email = policy.email;
        if (policy.address && existing.address === 'N/A') existing.address = policy.address;
      }
    });

    return Array.from(map.values());
  }, [policies]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return clientGroups;
    return clientGroups.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.primaryProvider.toLowerCase().includes(q)
    );
  }, [clientGroups, searchTerm]);

  const totalClients = clientGroups.length;
  const totalPortfolioValue = clientGroups.reduce((sum, c) => sum + c.totalPremium, 0);

  const handleExportClientsCsv = () => {
    const headers = ['Client Name', 'Phone', 'Email', 'Address', 'Total Policies', 'Total Annual Premium (₹)', 'Total Sum Assured (₹)'];
    const rows = clientGroups.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.address}"`,
      c.policies.length,
      c.totalPremium,
      c.totalSumAssured
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `V_Shiroya_Insurance_Clients_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" /> V Shiroya Insurance Client CRM Engine
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Customer Portfolio Directory</h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Centralized family floater and client insurance management. Group all policies per customer, trigger WhatsApp renewal alerts, and track client lifetime value.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportClientsCsv}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Client
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Managed Clients</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalClients}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">100% Account Isolated & Secure</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Portfolio Premium</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">₹{totalPortfolioValue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Combined client annual investment</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Policies Per Client</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {totalClients > 0 ? (policies.length / totalClients).toFixed(1) : '0'}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Cross-sell & Multi-policy depth</p>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search client name, phone number, email, or provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight">{client.name}</h3>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {client.primaryProvider}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] rounded-full border border-indigo-100 dark:border-indigo-800">
                  {client.policies.length} {client.policies.length === 1 ? 'Policy' : 'Policies'}
                </span>
              </div>

              {/* Client Metrics */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100/80 dark:border-slate-700/80 space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Total Premium:</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{client.totalPremium.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Total Coverage:</span>
                  <span className="font-extrabold text-indigo-700 dark:text-indigo-400">₹{client.totalSumAssured.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Phone:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{client.phone}</span>
                </div>
                <div className="flex justify-between truncate">
                  <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Email:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{client.email}</span>
                </div>
              </div>

              {/* Policy Badges */}
              <div className="space-y-1.5 mb-4">
                <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Active Policies:</p>
                <div className="flex flex-wrap gap-1.5">
                  {client.policies.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPolicy(p)}
                      className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-200 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>#{p.policyNumber.slice(0, 10)}</span>
                      <span className="text-[9px] font-extrabold opacity-60">({p.policyType})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Communication Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {client.phone !== 'N/A' && (
                  <>
                    <a
                      href={`tel:${client.phone}`}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                      title="Call Client"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${client.name}, this is your insurance advisor regarding your policy portfolio with ${client.primaryProvider}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                      title="WhatsApp Client"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </>
                )}
                {client.email !== 'N/A' && (
                  <a
                    href={`mailto:${client.email}?subject=${encodeURIComponent('Policy Portfolio Update')}`}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedClient(client)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                Client Dossier <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Add Client Profile</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Register new customer in V Shiroya Insurance CRM database.</p>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-slate-600 dark:text-slate-400 mb-1 block">Client Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 mb-1 block">Phone Number *</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 mb-1 block">Email Address</label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-slate-400 mb-1 block">Address</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newClient.name) {
                    onOpenAnalyze();
                    setShowAddModal(false);
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Save Client & Scan Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
