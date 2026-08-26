import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, KeyRound, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { TrendzLogoMark } from './TrendzLogo';

interface AuthLockScreenProps {
  onUnlock: () => void;
}

export const AuthLockScreen: React.FC<AuthLockScreenProps> = ({ onUnlock }) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password management states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const getStoredPassword = () => {
    return localStorage.getItem('trendz_accounts_master_pwd') || 'trendz123';
  };

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const stored = getStoredPassword();
    if (passwordInput === stored) {
      setError('');
      setIsSuccess(true);
      setTimeout(() => {
        sessionStorage.setItem('trendz_auth_unlocked', 'true');
        onUnlock();
      }, 400);
    } else {
      setError('Incorrect password. Please try again or use the default.');
    }
  };

  const handleQuickDefaultFill = () => {
    const stored = getStoredPassword();
    setPasswordInput(stored);
    setError('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    const stored = getStoredPassword();
    if (currentPasswordInput !== stored) {
      setChangeError('Current password is incorrect.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setChangeError('New password must be at least 4 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangeError('New passwords do not match.');
      return;
    }

    localStorage.setItem('trendz_accounts_master_pwd', newPasswordInput);
    setChangeSuccess('Password successfully updated! You can now log in.');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordInput(newPasswordInput);
    setTimeout(() => {
      setIsChangingPassword(false);
      setChangeSuccess('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070b10] flex items-center justify-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Architectural Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(217,119,6,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Lock Container */}
      <div className="max-w-md w-full relative z-10">
        <div className="bg-[#0e141d]/90 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_40px_rgba(217,119,6,0.15)] transition-all">
          
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-3 rounded-2xl bg-black border border-amber-500/50 shadow-[0_0_25px_rgba(223,186,115,0.25)] mb-4">
              <TrendzLogoMark size={56} variant="gold" />
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.22em] font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA73] via-[#FFF3D1] to-[#C89D4B] uppercase m-0">
                TRENDZ
              </h1>
              <span className="text-xl sm:text-2xl font-light tracking-[0.25em] font-serif text-amber-500 uppercase">
                INTERIOR
              </span>
            </div>

            <p className="text-xs text-amber-200/80 font-medium tracking-wide mt-1.5">
              Suite # LG - 11 Continental Shopping Mall
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold tracking-wider uppercase mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Accounts & Billing Security Gate</span>
            </div>
          </div>

          {!isChangingPassword ? (
            /* Login Form */
            <form onSubmit={handleUnlock} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Enter Accounts Password
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickDefaultFill}
                    className="text-[11px] font-normal text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                  >
                    Use Default (trendz123)
                  </button>
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter security password..."
                    autoFocus
                    className="w-full bg-black/60 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white rounded-xl px-4 py-3.5 pr-12 text-sm tracking-wide transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1 animate-in fade-in">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSuccess}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 active:scale-[0.98]'
                }`}
              >
                {isSuccess ? (
                  <>
                    <Unlock className="w-4 h-4 animate-bounce" />
                    <span>Access Granted...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Open Accounts Suite</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-500">Default: <code className="text-amber-300/90 font-mono">trendz123</code></span>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(true);
                    setError('');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-medium hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change Password</span>
                </button>
              </div>
            </form>
          ) : (
            /* Change Password View */
            <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 m-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Change Master Password
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setChangeError('');
                    setChangeSuccess('');
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Back to Login
                </button>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password..."
                  required
                  className="w-full bg-black/60 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (min 4 chars)..."
                  required
                  className="w-full bg-black/60 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter new password..."
                  required
                  className="w-full bg-black/60 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>

              {changeError && (
                <p className="text-xs text-rose-400 font-medium">⚠️ {changeError}</p>
              )}

              {changeSuccess && (
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {changeSuccess}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          )}

          {/* Studio Footer Info */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 font-medium tracking-wide m-0">
              Trendz Interior • Turnkey Architectural Fitouts & Invoicing System
            </p>
            <p className="text-[10px] text-slate-600 mt-1 m-0">
              Direct Contact: +92 300 8594210
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
