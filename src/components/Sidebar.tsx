import React from 'react';
import { VShiroyaLogo } from './VShiroyaLogo';
import { 
  LayoutDashboard, 
  FileSearch, 
  Sparkles, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Users,
  CircleDollarSign,
  Send,
  Lock,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  expiringCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  expiringCount,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Scan & Extract Policy', icon: Sparkles, highlight: true },
    { id: 'policies', label: 'Policy Database', icon: FileSearch },
    { id: 'clients', label: 'Clients CRM', icon: Users },
    { id: 'expiring', label: 'Renewals & Expiry', icon: AlertTriangle, badge: expiringCount > 0 ? expiringCount : undefined },
    { id: 'commissions', label: 'Commissions', icon: CircleDollarSign },
    { id: 'claims', label: 'Claim Intimation', icon: Send },
    { id: 'security', label: 'IRDAI & Security', icon: Lock },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavList = () => (
    <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto w-full min-w-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer group ${
              isActive
                ? 'bg-indigo-50/90 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-100/80 dark:border-indigo-800/80 font-bold -translate-y-[1px]'
                : item.highlight
                ? 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold hover:-translate-y-[1px]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 hover:-translate-y-[1px]'
            } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
          >
            <div className={`relative flex items-center justify-center shrink-0 ${
              item.highlight && !isActive ? 'text-indigo-600 dark:text-indigo-400' : ''
            }`}>
              <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''
              }`} />
              {isCollapsed && item.badge !== undefined && (
                <span className="hidden md:block absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </div>

            <span className={`flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis transition-transform duration-200 group-hover:translate-x-0.5 ${
              isCollapsed ? 'md:hidden' : ''
            }`}>
              {item.label}
            </span>

            {(!isCollapsed || isMobileOpen) && item.highlight && !isActive && (
              <span className="text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase shrink-0">
                AI
              </span>
            )}

            {(!isCollapsed || isMobileOpen) && item.badge !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0 shadow-2xs">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (Pinned) */}
      <aside
        className={`hidden md:flex relative flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none z-30 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header with V SHIROYA LOGO */}
        <div className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800 select-none ${
          isCollapsed ? 'justify-between px-2.5' : 'justify-between px-4'
        }`}>
          <div className="flex items-center overflow-hidden shrink-0 cursor-pointer">
            <VShiroyaLogo size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} />
          </div>

          <button
            onClick={onToggleCollapse}
            className={`rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isCollapsed ? 'w-6 h-6' : 'w-7 h-7'
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        {renderNavList()}

        {/* Footer Info */}
        {!isCollapsed && (
          <div className="p-3 m-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              VS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">V Shiroya</span>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 truncate">Insurance & Financials</span>
            </div>
          </div>
        )}
      </aside>

      {/* MOBILE SLIDE-OVER DRAWER SIDEBAR */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/65 dark:bg-slate-950/80 transition-opacity animate-in fade-in duration-300"
            onClick={onCloseMobile}
          />

          {/* Drawer Menu Container */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <VShiroyaLogo size="sm" showText={true} />

              <button
                onClick={onCloseMobile}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation List */}
            {renderNavList()}

            {/* Mobile Footer */}
            <div className="p-3 m-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                VS
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">V Shiroya</span>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 truncate">Insurance & Financials</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

