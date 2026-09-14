import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Compass,
  Flame,
  ArrowRight,
} from 'lucide-react';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';
import { DEMO_CREDENTIALS } from '../services/authService';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import type { ThemeMode } from '../types';

interface AuthPortalProps {
  onLogin: (credentials: LoginCredentials) => Promise<AuthResponse>;
  onRegister: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  onContinueAsGuest: () => void;
  onSuccessToast: (msg: string) => void;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

const AVATARS = [
  { id: 'scholar', label: 'Scholar', emoji: '📜', desc: 'Seeker of algorithmic lore' },
  { id: 'warrior', label: 'Warrior', emoji: '🛡️', desc: 'Defender of system stability' },
  { id: 'mage', label: 'Mage', emoji: '🔮', desc: 'Weaver of cognitive spells' },
  { id: 'ranger', label: 'Ranger', emoji: '🏹', desc: 'Navigator of data dunes' },
];

const REALM_PREVIEWS = [
  { icon: '🌲', name: 'Algorithmic Forest', subject: 'DAA', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300' },
  { icon: '🏔️', name: 'Mountain of Systems', subject: 'OS', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-300' },
  { icon: '🌸', name: 'Ancient Sakura City', subject: 'NoSQL', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-300' },
  { icon: '🌌', name: 'Mind Sanctuary', subject: 'HDA & CI', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-300' },
  { icon: '🏝️', name: 'Floating Archipelago', subject: 'GV', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-300' },
];

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLogin,
  onRegister,
  onContinueAsGuest,
  onSuccessToast,
  currentTheme,
  onSelectTheme,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('scholar');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await onLogin({ emailOrUsername: identifier, password });
      if (res.success && res.user) {
        onSuccessToast(`⚔️ Welcome back, Adventurer ${res.user.username}!`);
      } else {
        setErrorMsg(res.error || 'Failed to authenticate.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await onRegister({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        avatarId: selectedAvatar,
      });
      if (res.success && res.user) {
        onSuccessToast(`✨ Adventurer seal created! Welcome, ${res.user.username}!`);
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await onLogin({
        emailOrUsername: DEMO_CREDENTIALS.usernameOrEmail,
        password: DEMO_CREDENTIALS.password,
      });
      if (res.success && res.user) {
        onSuccessToast(`⚡ Entered flourishing Demo Realm as ${res.user.username}!`);
      } else {
        setErrorMsg(res.error || 'Could not load demo user.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#fff5f8] text-slate-900 transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b-2 border-pink-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-pink-50 border-2 border-pink-400 flex items-center justify-center shadow-[2px_2px_0px_#f472b6]">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="8" y1="26" x2="24" y2="6" stroke="#8c6036" strokeWidth="3" strokeLinecap="square" />
              <line x1="9" y1="25" x2="23" y2="7" stroke="#e8ba6e" strokeWidth="1.5" strokeLinecap="square" />
              <path d="M18 10C12 5 6 9 8 16C10 20 16 18 20 14Z" fill="#f472b6" stroke="#ec4899" strokeWidth="1.5" />
              <path d="M22 6C28 3 31 8 29 14C27 18 22 17 19 11Z" fill="#f472b6" stroke="#ec4899" strokeWidth="1.5" />
              <rect x="18" y="10" width="3" height="3" fill="#be185d" />
            </svg>
          </div>
          <div>
            <h1 className="text-slate-800 font-pixel-heading text-sm tracking-wider">
              GOD OF REALMS
            </h1>
            <p className="text-pink-600 font-bold text-[10px] font-pixel">
              ✦ Gamified Fantasy Study Journal ✦
            </p>
          </div>
        </div>

        {/* Theme switcher */}
        <div className="flex items-center gap-3">
          <ThemeToggle currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
        </div>
      </header>

      {/* Main Portal Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left Hero & Lore Column */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 border border-pink-300 text-pink-700 text-xs font-pixel font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>AUTHENTICATION PORTAL</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-pixel-heading text-slate-800 leading-tight">
            RESTORE YOUR <span className="text-pink-600">REALMS</span> THROUGH STUDY.
          </h2>

          <p className="text-slate-600 font-pixel text-xs md:text-sm leading-relaxed max-w-xl">
            Every focused minute spent studying grants experience points, unearths ancient artifacts, levels up your adventurer profile, and visually cultivates 5 distinct fantasy worlds.
          </p>

          {/* 5 Realms Grid Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {REALM_PREVIEWS.map((realm, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border-2 ${realm.bg} flex items-center gap-3 shadow-[2px_2px_0px_#f472b6]`}
              >
                <span className="text-2xl">{realm.icon}</span>
                <div>
                  <div className={`text-xs font-pixel font-bold ${realm.color}`}>
                    {realm.name}
                  </div>
                  <div className="text-[10px] font-pixel text-slate-500">
                    Subject: {realm.subject}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Security & Features badges */}
          <div className="pt-2 flex flex-wrap gap-4 text-[11px] font-pixel text-slate-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographic JWT (HS256)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Isolated Per-User Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-500" />
              <span>No Server Lag or Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="w-full max-w-md bg-white border-2 border-pink-400 rounded-2xl shadow-[8px_8px_0px_#f472b6] p-6 md:p-8 relative overflow-hidden">
          {/* Decorative Corner Rune */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-100/50 rounded-bl-full pointer-events-none border-b border-l border-pink-200" />

          {/* Tab Switcher */}
          <div className="flex border-2 border-pink-300 rounded-xl p-1 mb-6 bg-pink-50/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-pixel font-bold rounded-lg cursor-pointer transition-all ${
                mode === 'login'
                  ? 'bg-pink-500 text-white shadow-[2px_2px_0px_#db2777]'
                  : 'text-slate-600 hover:text-pink-600'
              }`}
            >
              Enter Realm (Sign In)
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-pixel font-bold rounded-lg cursor-pointer transition-all ${
                mode === 'register'
                  ? 'bg-pink-500 text-white shadow-[2px_2px_0px_#db2777]'
                  : 'text-slate-600 hover:text-pink-600'
              }`}
            >
              Inscribe Seal (Register)
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border-2 border-red-300 text-red-700 text-xs font-pixel font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* One-Click Pre-Leveled Demo Banner Button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl border-2 border-amber-700 font-pixel font-bold text-xs shadow-[3px_3px_0px_#b45309] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-200 fill-amber-300" />
                <div className="text-left">
                  <div className="leading-tight">⚡ EXPLORE LEVELED DEMO REALM</div>
                  <div className="text-[10px] text-amber-100 font-normal">Pre-built Lv. 5 realms, 700m study stats & charts</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-100 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-pink-200"></div>
            <span className="flex-shrink mx-3 text-[10px] font-pixel text-slate-400 uppercase font-bold">
              Or Use Your Credentials
            </span>
            <div className="flex-grow border-t border-pink-200"></div>
          </div>

          {/* Sign In Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                  Adventurer Name or Scroll Address (Email)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="RealmWalker or hero@realms.com"
                    className="w-full pl-9 pr-3 py-2 text-xs font-pixel rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:outline-none bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                  Passphrase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs font-pixel rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:outline-none bg-white text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-pixel font-bold text-xs rounded-xl border-2 border-pink-600 shadow-[3px_3px_0px_#db2777] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <span>Verifying JWT Key...</span> : <span>Enter Your World</span>}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                  Adventurer Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="GrandScholar42"
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-pixel rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:outline-none bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="scholar@realms.com"
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-pixel rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:outline-none bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-1.5 text-xs font-pixel rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:outline-none bg-white text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                  Choose Class
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`p-1.5 rounded-lg border-2 text-center cursor-pointer transition-all ${
                        selectedAvatar === av.id
                          ? 'border-pink-500 bg-pink-100 shadow-[2px_2px_0px_#f472b6]'
                          : 'border-pink-200 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-lg">{av.emoji}</div>
                      <div className="text-[9px] font-pixel font-bold text-slate-700 mt-0.5 truncate">
                        {av.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-pixel font-bold text-xs rounded-xl border-2 border-pink-600 shadow-[3px_3px_0px_#db2777] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <span>Inscribing Token...</span> : <span>Create Account</span>}
              </button>
            </form>
          )}

          {/* Continue as Guest option */}
          <div className="mt-5 pt-3 border-t border-pink-200 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs font-pixel text-slate-500 hover:text-pink-600 font-bold underline cursor-pointer transition-colors"
            >
              Continue as Guest (No Account Required) →
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-pink-200 text-slate-500 font-pixel text-xs bg-white/60">
        God of Realms · Gamified Study Productivity · Secured with JWT
      </footer>
    </div>
  );
};
