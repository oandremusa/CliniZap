import { ReactNode } from 'react';
import { User } from 'firebase/auth';
import { Calendar, Plus, Stethoscope, UserCircle, Users } from 'lucide-react';
import { AppTab } from '../types';
import { UserAvatar } from './UserAvatar';

interface AppShellProps {
  user: User;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenNewPatient: () => void;
  patientCount: number;
  children: ReactNode;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof Users }[] = [
  { id: 'pacientes', label: 'Pacientes', icon: Users },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'conta', label: 'Conta', icon: UserCircle },
];

const TAB_LABELS: Record<AppTab, string> = {
  pacientes: 'Pacientes',
  agenda: 'Agenda',
  conta: 'Conta',
};

export function AppShell({
  user,
  activeTab,
  onTabChange,
  onOpenNewPatient,
  patientCount,
  children,
}: AppShellProps) {
  const displayName = user.displayName || user.email?.split('@')[0] || 'Profissional';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-20">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            CliniZap
          </span>
        </div>

        {/* Primary Navigation */}
        <nav aria-label="Menu principal" className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full min-h-[42px] px-3.5 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${
                  isActive
                    ? 'bg-teal-50/90 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-teal-700' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === 'pacientes' && patientCount > 0 && (
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    {patientCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logged User Quick Profile & Footer */}
        <div className="p-4 border-t border-slate-200/80 space-y-3">
          <button
            type="button"
            onClick={() => onTabChange('conta')}
            className="w-full p-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          >
            <UserAvatar name={displayName} photoURL={user.photoURL} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          </button>
          <p className="px-2 text-[11px] text-slate-400 tabular-nums">© 2026 CliniZap</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar Contract: Responsive Mobile Nav + Contextual Desktop Breadcrumb */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Zone 1: Brand on Mobile / Contextual Breadcrumb on Desktop */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="lg:hidden w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="lg:hidden font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
                CliniZap
              </span>

              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-slate-400 whitespace-nowrap shrink-0">CliniZap</span>
                <span className="text-slate-300" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-slate-900 whitespace-nowrap shrink-0">
                  {TAB_LABELS[activeTab]}
                </span>
              </div>
            </div>

            {/* Zone 2 (Mobile/Tablet): Clean Single-Line Navigation Links */}
            <nav
              aria-label="Navegação mobile"
              className="flex lg:hidden items-center gap-1 bg-slate-100/90 p-1 rounded-lg"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${
                      isActive
                        ? 'bg-white text-teal-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Single Primary Action */}
            <div className="hidden sm:flex items-center shrink-0">
              {activeTab === 'pacientes' ? (
                <button
                  type="button"
                  onClick={onOpenNewPatient}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Novo paciente</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onTabChange('pacientes')}
                  className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
                >
                  Ver pacientes
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
