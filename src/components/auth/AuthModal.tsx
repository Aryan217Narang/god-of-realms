import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Lock, Mail, User as UserIcon, Eye, EyeOff, Zap } from 'lucide-react';
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../../types/auth';
import { DEMO_CREDENTIALS } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: LoginCredentials) => Promise<AuthResponse>;
  onRegister: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  onSuccessToast: (msg: string) => void;
}

const AVATARS = [
  { id: 'scholar', label: 'Scholar', emoji: '📜', desc: 'Seeker of ancient algorithmic lore' },
  { id: 'warrior', label: 'Warrior', emoji: '🛡️', desc: 'Defender of system stability' },
  { id: 'mage', label: 'Mage', emoji: '🔮', desc: 'Weaver of cosmic neural spells' },
  { id: 'ranger', label: 'Ranger', emoji: '🏹', desc: 'Navigator of vast database dunes' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onSuccessToast,
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

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await onLogin({ emailOrUsername: identifier, password });
      if (res.success && res.user) {
        onSuccessToast(`⚔️ Welcome back, Adventurer ${res.user.username}!`);
        onClose();
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
        onSuccessToast(`✨ Adventurer parchment inscribed! Welcome, ${res.user.username}!`);
        onClose();
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await onLogin({
        emailOrUsername: DEMO_CREDENTIALS.usernameOrEmail,
        password: DEMO_CREDENTIALS.password,
      });
      if (res.success && res.user) {
        onSuccessToast(`⚡ Demo Adventurer (${res.user.username}) loaded via JWT!`);
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white border-2 border-pink-400 rounded-xl shadow-[6px_6px_0px_#f472b6] p-6 relative overflow-hidden text-slate-800 modal-container"
        style={{
          backgroundColor: 'var(--panel-bg, #ffffff)',
          borderColor: 'var(--border-color, #f472b6)',
          color: 'var(--text-color, #1e293b)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-pink-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 border-2 border-pink-300 text-pink-600 mb-3 shadow-[2px_2px_0px_#f472b6]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-pixel-heading tracking-wide">
            {mode === 'login' ? 'ADVENTURER SIGN IN' : 'INSCRIBE YOUR SEAL'}
          </h2>
          <p className="text-xs font-pixel text-pink-600 font-semibold mt-1">
            ✦ JWT Encrypted Portal to God of Realms ✦
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-2 border-pink-300 rounded-lg p-1 mb-5 bg-pink-50/50">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-pixel font-bold rounded cursor-pointer transition-all ${
              mode === 'login'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-pixel font-bold rounded cursor-pointer transition-all ${
              mode === 'register'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border-2 border-red-400 text-red-700 text-xs font-pixel font-semibold flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                Adventurer ID or Email
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
              className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-pixel font-bold text-xs rounded-lg border-2 border-pink-600 shadow-[3px_3px_0px_#db2777] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Inscribing Token...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Enter Realms</span>
                </>
              )}
            </button>

            {/* Quick Demo Button */}
            <div className="pt-2 border-t border-pink-200">
              <button
                type="button"
                onClick={handleDemoFill}
                disabled={loading}
                className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border-2 border-amber-300 rounded-lg font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>One-Click Demo Login (RealmWalker)</span>
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                Adventurer Handle
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
                  placeholder="SovereignOfCode"
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-pixel rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:outline-none bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                Scroll Address (Email)
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
                  placeholder="adventurer@realms.com"
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-pixel rounded-lg border-2 border-pink-300 focus:border-pink-500 focus:outline-none bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                Secret Phrase (Password, min 6 chars)
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

            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-pixel font-bold text-slate-700 mb-1">
                Select Class
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
              className="w-full mt-2 py-2.5 px-4 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-pixel font-bold text-xs rounded-lg border-2 border-pink-600 shadow-[3px_3px_0px_#db2777] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Generating Cryptographic Token...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Seal Adventurer Scroll</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security / JWT Note */}
        <div className="mt-4 pt-3 border-t border-pink-200 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-pixel text-slate-500">
            <Lock className="w-3 h-3 text-pink-500" />
            <span>Tokens signed via HMAC-SHA256 (RFC 7519)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
