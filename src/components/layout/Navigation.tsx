import React from 'react';
import { LayoutDashboard, Globe, Timer, BarChart3, Trophy, Settings, LogIn, LogOut, Shield } from 'lucide-react';
import { VineDecoration } from '../journal/VineDecoration';
import type { User } from '../../types/auth';

export type Page = 'dashboard' | 'realms' | 'timer' | 'statistics' | 'achievements' | 'settings' | 'realm-detail';

interface NavProps {
  currentPage: Page;
  onNavigate: (page: Page, extra?: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'realms', label: 'My Realms', icon: Globe },
  { id: 'timer', label: 'Study Timer', icon: Timer },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

const AVATAR_EMOJIS: Record<string, string> = {
  scholar: '📜',
  warrior: '🛡️',
  mage: '🔮',
  ranger: '🏹',
};

export const Navigation: React.FC<NavProps> = ({
  currentPage,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <>
      {/* Desktop Ancient Equipment Panel Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 flex-shrink-0 bg-white border-r-2 border-pink-200 shadow-xl z-20 select-none">
        {/* Living Vine climbing from top edge */}
        <VineDecoration position="top-left" flowerColor="#f472b6" className="opacity-90" />

        {/* Top Logo Panel */}
        <div className="nav-logo-panel p-4 border-b-2 border-pink-200 bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-center gap-3">
            {/* Mythical Relic Axe Logo */}
            <div className="w-10 h-10 rounded bg-pink-50 border-2 border-pink-400 flex items-center justify-center shadow-[2px_2px_0px_#f472b6] relative overflow-hidden group">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="8" y1="26" x2="24" y2="6" stroke="#8c6036" strokeWidth="3" strokeLinecap="square" />
                <line x1="9" y1="25" x2="23" y2="7" stroke="#e8ba6e" strokeWidth="1.5" strokeLinecap="square" />
                <path d="M18 10C12 5 6 9 8 16C10 20 16 18 20 14Z" fill="#f472b6" stroke="#ec4899" strokeWidth="1.5" />
                <path d="M22 6C28 3 31 8 29 14C27 18 22 17 19 11Z" fill="#f472b6" stroke="#ec4899" strokeWidth="1.5" />
                <rect x="18" y="10" width="3" height="3" fill="#be185d" />
              </svg>
            </div>

            <div>
              <h1 className="text-slate-800 font-pixel-heading text-xs tracking-wider leading-tight">
                GOD OF REALMS
              </h1>
              <p className="text-pink-600 font-bold text-[11px] font-pixel mt-0.5">
                ✦ Pixel Study Worlds
              </p>
            </div>
          </div>
        </div>

        {/* Quest Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-pixel text-pink-600 font-bold uppercase tracking-wider">
            Quest Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded transition-all duration-150 cursor-pointer text-left relative overflow-hidden group border-2 ${
                  active
                    ? 'bg-pink-100/90 border-pink-400 text-pink-800 font-bold shadow-[3px_3px_0px_#f472b6]'
                    : 'border-transparent text-slate-600 hover:text-pink-600 hover:bg-pink-50 hover:border-pink-200'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-500 shadow-[0_0_8px_#ec4899]" />
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center border text-xs ${
                      active
                        ? 'bg-white border-pink-400 text-pink-600 shadow-sm'
                        : 'bg-pink-50 border-pink-200 text-pink-500 group-hover:border-pink-400 group-hover:text-pink-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className={`text-xs font-pixel ${active ? 'font-bold text-pink-900' : ''}`}>
                    {item.label}
                  </span>
                </div>

                {active ? (
                  <span className="text-[10px] text-pink-600 font-pixel-mono animate-pulse">
                    ▶
                  </span>
                ) : (
                  <span className="text-[10px] text-pink-300 font-pixel opacity-0 group-hover:opacity-100">
                    ›
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Adventurer Profile / Auth Plaque */}
        <div className="p-3 border-t-2 border-pink-200 bg-pink-50/60">
          {user ? (
            <div className="nav-user-plaque p-2.5 rounded-lg border-2 border-pink-300 bg-white shadow-[2px_2px_0px_#f472b6]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xl flex-shrink-0" role="img" aria-label="avatar">
                    {AVATAR_EMOJIS[user.avatarId] || '⚔️'}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-pixel font-bold text-slate-800 truncate">
                      {user.username}
                    </div>
                    <div className="text-[9px] font-pixel text-pink-600 truncate">
                      {user.title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[9px] font-pixel text-emerald-600 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>JWT Active</span>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2 px-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg border-2 border-pink-600 font-pixel font-bold text-xs shadow-[2px_2px_0px_#db2777] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Adventurer Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-pink-200 shadow-2xl flex items-center justify-around px-2 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-all cursor-pointer ${
                active ? 'text-pink-600 font-bold' : 'text-slate-500 hover:text-pink-500'
              }`}
            >
              <div className={`p-1.5 rounded ${active ? 'bg-pink-100 border border-pink-400 text-pink-600' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-pixel truncate max-w-[50px]">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile Auth Button */}
        <button
          onClick={user ? onLogout : onOpenAuth}
          className="flex flex-col items-center gap-1 p-1 rounded transition-all cursor-pointer text-slate-500 hover:text-pink-500"
          title={user ? `Signed in as ${user.username} (Click to Sign Out)` : 'Sign In'}
        >
          <div className="p-1.5 rounded bg-pink-50 border border-pink-200 text-pink-500">
            {user ? <LogOut className="w-4 h-4 text-red-500" /> : <LogIn className="w-4 h-4 text-pink-600" />}
          </div>
          <span className="text-[9px] font-pixel truncate max-w-[50px]">
            {user ? 'Exit' : 'Sign In'}
          </span>
        </button>
      </nav>
    </>
  );
};

