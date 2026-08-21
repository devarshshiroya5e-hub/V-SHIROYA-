import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Trash2, 
  Sparkles,
  Grid,
  List as ListIcon,
  Download,
  FileSpreadsheet,
  HeartPulse,
  Shield,
  Car,
  Flame,
  Plane,
  Tag
} from 'lucide-react';
import { PolicyRecord } from '../types/index';
import { downloadPolicyPdf } from '../lib/pdfUtils';
import { downloadSinglePolicyExcel, downloadPoliciesBulkExcel } from '../lib/excelUtils';
import { getPolicyCategory, getCategoryBadgeStyle, PolicyCategoryType } from '../lib/categoryUtils';

interface PoliciesListViewProps {
  policies: PolicyRecord[];
  onSelectPolicy: (policy: PolicyRecord) => void;
  onOpenAnalyze: () => void;
  onDeletePolicy: (id: string) => void;
}

export const PoliciesListView: React.FC<PoliciesListViewProps> = ({
  policies,
  onSelectPolicy,
  onOpenAnalyze,
  onDeletePolicy
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'ownerName' | 'premiumAmount' | 'endDate' | 'category'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Extract unique providers & categories
  const providers = useMemo(() => {
    const set = new Set<string>();
    policies.forEach(p => p.providerCompany && set.add(p.providerCompany));
    return Array.from(set);
  }, [policies]);

  const categories = useMemo(() => {
    return ['Life', 'Health', 'Vehicle', 'Fire', 'Travel', 'General'];
  }, []);

  // Category Icon helper
  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'Life':
        return <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      case 'Health':
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'Vehicle':
        return <Car className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'Fire':
        return <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'Travel':
        return <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  // Filter & Sort
  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const cat = getPolicyCategory(p);

      const matchesQuery = !q || (
        p.ownerName.toLowerCase().includes(q) ||
        p.policyNumber.toLowerCase().includes(q) ||
        p.phoneNumber?.toLowerCase().includes(q) ||
        p.providerCompany.toLowerCase().includes(q) ||
        p.policyType.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );

      const matchesStatus = statusFilter === 'ALL' || p.policyStatus === statusFilter;
      const matchesProvider = providerFilter === 'ALL' || p.providerCompany === providerFilter;
      const matchesCategory = categoryFilter === 'ALL' || cat === categoryFilter;

      return matchesQuery && matchesStatus && matchesProvider && matchesCategory;
    }).sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'category') {
        valA = getPolicyCategory(a);
        valB = getPolicyCategory(b);
      } else if (sortBy === 'premiumAmount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [policies, searchTerm, statusFilter, providerFilter, categoryFilter, sortBy, sortOrder]);

  const handleExportCsv = () => {
    const headers = [
      'Policy ID',
      'Owner / Proposer Name',
      'Policy Number',
      'Provider / Company',
      'Policy Type',
      'Category',
      'Status',
      'Premium Amount (INR)',
      'Sum Assured (INR)',
      'Payment Mode',
      'Start Date',
      'End Date / Maturity',
      'Nominee Name',
      'Nominee Relation',
      'Phone Number',
      'Email Address',
      'Assigned Agent',
      'Servicing Branch'
    ];

    const escapeCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredPolicies.map(p => [
      escapeCell(p.id),
      escapeCell(p.ownerName),
      escapeCell(p.policyNumber),
      escapeCell(p.providerCompany),
      escapeCell(p.policyType),
      escapeCell(p.category || getPolicyCategory(p)),
      escapeCell(p.policyStatus),
      p.premiumAmount || 0,
      p.sumAssured || 0,
      escapeCell(p.paymentMode || ''),
      escapeCell(p.startDate || ''),
      escapeCell(p.endDate || ''),
      escapeCell(p.nominee || ''),
      escapeCell(p.nomineeRelationship || ''),
      escapeCell(p.phoneNumber || ''),
      escapeCell(p.email || ''),
      escapeCell(p.agentName || 'V Shiroya Advisor'),
      escapeCell(p.branchName || 'Main Office')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `V_Shiroya_Policies_Filtered_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden space-y-6 pb-12 animate-in fade-in duration-250">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            All Managed Policies
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Search owner name, filter by status or provider company.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadPoliciesBulkExcel(filteredPolicies)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Download selected/filtered policies as an Excel spreadsheet (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel Sheet</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Export all currently filtered policies to CSV file for offline reporting"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Export Filtered CSV ({filteredPolicies.length})</span>
          </button>

          <button
            onClick={onOpenAnalyze}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze New Policy</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search owner name, policy #, category, phone, provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL" className="dark:bg-slate-900">All Categories</option>
              <option value="Life" className="dark:bg-slate-900">Life Insurance</option>
              <option value="Health" className="dark:bg-slate-900">Health Insurance</option>
              <option value="Vehicle" className="dark:bg-slate-900">Vehicle Insurance</option>
              <option value="Fire" className="dark:bg-slate-900">Fire / Property</option>
              <option value="Travel" className="dark:bg-slate-900">Travel Insurance</option>
              <option value="General" className="dark:bg-slate-900">General / Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL" className="dark:bg-slate-900">All Statuses</option>
              <option value="ACTIVE" className="dark:bg-slate-900">Active Only</option>
              <option value="EXPIRING SOON" className="dark:bg-slate-900">Expiring Soon</option>
              <option value="EXPIRED" className="dark:bg-slate-900">Expired</option>
            </select>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[160px]"
            >
              <option value="ALL" className="dark:bg-slate-900">All Providers</option>
              {providers.map((p, i) => (
                <option key={i} value={p} className="dark:bg-slate-900">{p}</option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="createdAt" className="dark:bg-slate-900">Sort: Date Added</option>
              <option value="category" className="dark:bg-slate-900">Sort: Policy Category</option>
              <option value="ownerName" className="dark:bg-slate-900">Sort: Owner Name</option>
              <option value="premiumAmount" className="dark:bg-slate-900">Sort: Premium Value</option>
              <option value="endDate" className="dark:bg-slate-900">Sort: End Date</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Category Tag Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Category Tags:
          </span>
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({policies.length})
          </button>
          {categories.map((cat) => {
            const count = policies.filter(p => getPolicyCategory(p) === cat).length;
            const badgeStyle = getCategoryBadgeStyle(cat);
            const isSelected = categoryFilter === cat;

            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(isSelected ? 'ALL' : cat)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : `${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:opacity-80`
                }`}
              >
                {renderCategoryIcon(cat)}
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List Display */}
      {filteredPolicies.length > 0 ? (
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Policy Owner</th>
                  <th className="py-3 px-3">Policy #</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Provider</th>
                  <th className="py-3 px-3">Policy Type</th>
                  <th className="py-3 px-3">Premium (₹)</th>
                  <th className="py-3 px-3">End Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {filteredPolicies.map((policy) => {
                  const cat = getPolicyCategory(policy);
                  const badgeStyle = getCategoryBadgeStyle(cat);

                  return (
                    <tr key={policy.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{policy.ownerName}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{policy.phoneNumber || 'No phone'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-indigo-900 dark:text-indigo-400">#{policy.policyNumber}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200`}>
                          {renderCategoryIcon(cat)}
                          <span>{cat}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">{policy.providerCompany}</td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">{policy.policyType}</td>
                      <td className="py-3.5 px-3 font-extrabold text-slate-900 dark:text-slate-100">
                        ₹{policy.premiumAmount?.toLocaleString('en-IN') || '0'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{policy.endDate || 'N/A'}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          policy.policyStatus === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : policy.policyStatus === 'EXPIRING SOON'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {policy.policyStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => downloadSinglePolicyExcel(policy)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs rounded-lg transition-colors cursor-pointer border border-emerald-200/80 dark:border-emerald-800"
                            title="Download Policy Excel Details (.xlsx / .csv)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() => downloadPolicyPdf(policy)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs rounded-lg transition-colors cursor-pointer border border-indigo-200/80 dark:border-indigo-800"
                            title="Download Policy PDF Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => onSelectPolicy(policy)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onDeletePolicy(policy.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Policy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPolicies.map((policy) => {
              const cat = getPolicyCategory(policy);
              const badgeStyle = getCategoryBadgeStyle(cat);

              return (
                <div
                  key={policy.id}
                  onClick={() => onSelectPolicy(policy)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs lift-card-primary cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase truncate">
                        {policy.providerCompany}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                        policy.policyStatus === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : policy.policyStatus === 'EXPIRING SOON'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {policy.policyStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">{policy.ownerName}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200`}>
                        {renderCategoryIcon(cat)}
                        <span>{cat}</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-4">#{policy.policyNumber}</p>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Type:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{policy.policyType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Premium:</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{policy.premiumAmount?.toLocaleString('en-IN') || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">End Date:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{policy.endDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">{policy.phoneNumber || 'No phone'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadSinglePolicyExcel(policy);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer border border-emerald-200/80 dark:border-emerald-800"
                        title="Download Policy Excel Details"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Excel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPolicyPdf(policy);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer border border-indigo-200/80 dark:border-indigo-800"
                        title="Download Policy PDF"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800">View →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center shadow-2xs">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">No policies found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            No policies matching your search criteria. Upload a policy document or adjust your filter query.
          </p>
          <button
            onClick={onOpenAnalyze}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Analyze First Policy
          </button>
        </div>
      )}
    </div>
  );
};
