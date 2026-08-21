import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Bell, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  User,
  LogOut,
  FileText,
  Mail,
  Send,
  Sun,
  Moon
} from 'lucide-react';
import { PolicyRecord, AccountantUser } from '../types/index';

interface TopbarProps {
  user: AccountantUser;
  policies: PolicyRecord[];
  onSelectPolicy: (policy: PolicyRecord) => void;
  onOpenAnalyze: () => void;
  onSelectTab: (tab: string) => void;
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  user,
  policies,
  onSelectPolicy,
  onOpenAnalyze,
  onSelectTab,
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const expiringPolicies = policies.filter(p => p.policyStatus === 'EXPIRING SOON');

  // Filter search matches
  const searchResults = searchQuery.trim()
    ? policies.filter(p =>
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.providerCompany.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs transition-colors duration-200">
      {/* Mobile Animated Round Hamburger Menu Button ("Three Line") */}
      {onToggleMobileSidebar && (
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden relative w-10 h-9 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all duration-500 cursor-pointer shrink-0 group active:scale-95"
          title="Toggle Navigation Sidebar"
          aria-label="Toggle Navigation Sidebar"
        >
          <span className={`w-4 h-0.5 bg-slate-800 dark:bg-slate-200 rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform origin-center ${
            isMobileSidebarOpen ? 'rotate-45 translate-y-[8px]' : ''
          }`} />
          <span className={`w-4 h-0.5 bg-slate-800 dark:bg-slate-200 rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform origin-center ${
            isMobileSidebarOpen ? 'opacity-0' : ''
          }`} />
          <span className={`w-4 h-0.5 bg-slate-800 dark:bg-slate-200 rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform origin-center ${
            isMobileSidebarOpen ? '-rotate-45 -translate-y-[8px]' : ''
          }`} />
        </button>
      )}

      {/* Global Search Area */}
      <div className="relative flex-1 max-w-xl" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors" />
          <input
            type="text"
            placeholder="Search policy owner, policy number, phone, provider..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-all duration-180"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Search Results ({searchResults.length})
            </div>
            {searchResults.length > 0 ? (
              searchResults.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => {
                    onSelectPolicy(policy);
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer"
                >
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {policy.ownerName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      #{policy.policyNumber} • {policy.providerCompany}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ₹{policy.premiumAmount?.toLocaleString('en-IN') || '0'}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      policy.policyStatus === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : policy.policyStatus === 'EXPIRING SOON'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {policy.policyStatus}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No policy owner or number matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Intelligence Active Status Pill (#49) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-tight">AI Intelligence Active</span>
        </div>

        {/* Security Encrypted Vault Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] font-bold shadow-2xs lift-card-subtle">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>256-Bit Encrypted Vault</span>
        </div>

        {/* Dark Mode Toggle Button */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-2 shadow-2xs lift-card-subtle active:scale-95"
            title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span className="text-xs font-bold hidden xl:inline text-amber-400">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold hidden xl:inline text-slate-700">Dark</span>
              </>
            )}
          </button>
        )}

        {/* Analyze Policy Button */}
        <button
          onClick={onOpenAnalyze}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs lift-button cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span className="hidden sm:inline">Analyze Policy</span>
          <span className="sm:hidden">Analyze</span>
        </button>

        {/* Notifications Drawer Toggle */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {expiringPolicies.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {expiringPolicies.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">30-Day Expiry Alerts</span>
                </div>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 px-2 py-0.5 rounded-full">
                  {expiringPolicies.length} Expiring
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {expiringPolicies.length > 0 ? (
                  expiringPolicies.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPolicy(p);
                        setShowNotifications(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {p.ownerName} (Expires Soon)
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          #{p.policyNumber} • Ends {p.endDate || 'Upcoming'}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>All policy renewals up to date!</span>
                  </div>
                )}
              </div>
              <div className="px-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    onSelectTab('expiring');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>30-Day Email Alert Center →</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user.name
                ? user.name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : 'VS'}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline">
              {user.name || 'VIJAY SHIROYA'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.firmName}</p>
              </div>
              <button
                onClick={() => {
                  onSelectTab('settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Account Profile & Security</span>
              </button>
              <button
                onClick={() => {
                  onSelectTab('settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Audit Logs & Security</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Lock Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

