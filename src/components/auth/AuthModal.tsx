import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { 
  X, Lock, Mail, User, Eye, EyeOff, ShieldCheck, 
  Sparkles, ArrowRight, CheckCircle2, AlertCircle, LogIn, UserPlus, 
  RefreshCw, Check, KeyRound, Clock, Database, GraduationCap
} from 'lucide-react';
import { VeyraLogo } from '../common/VeyraLogo';

type ModalView = 'login' | 'register' | 'verify' | 'forgot_request' | 'forgot_reset';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, closeAuthModal, authModalMode, authModalNotice, 
    login, register, verifyEmail, resendVerification, forgotPassword, resetPassword,
    isBackendConnected
  } = useAuth();
  const { language, t } = useLanguage();

  const [activeView, setActiveView] = useState<ModalView>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Register State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regRole, setRegRole] = useState<UserRole>('learner');
  const [regAgreedToTerms, setRegAgreedToTerms] = useState<boolean>(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState<boolean>(false);

  // Email Verification State (6-digit OTP)
  const [verifyTargetEmail, setVerifyTargetEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [testOtpCode, setTestOtpCode] = useState<string | null>(null);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);

  // Input refs for 6-digit OTP
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync mode when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      if (authModalMode === 'register') {
        setActiveView('register');
      } else {
        setActiveView('login');
      }
      setLoginError(null);
      setRegError(null);
      setVerifyError(null);
      setVerifySuccess(null);
    }
  }, [isAuthModalOpen, authModalMode]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  // Password Strength Calculator
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score, label: 'Weak (कमज़ोर)', color: 'bg-rose-500' };
    if (score <= 50) return { score, label: 'Fair (मध्यम)', color: 'bg-amber-500' };
    if (score <= 75) return { score, label: 'Good (अच्छा)', color: 'bg-blue-500' };
    return { score, label: 'Strong (मजबूत)', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(regPassword);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        if (res.requireVerification) {
          // Flip to verification view with target email!
          setVerifyTargetEmail(res.email || loginEmail);
          setTestOtpCode(res.testOtpCode || null);
          setVerifyError(res.message || 'Please verify your email address to log in.');
          setResendCooldown(45);
          setActiveView('verify');
        } else {
          setLoginError(res.message || 'Login failed. Please check credentials.');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login error occurred.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. (पासवर्ड मेल नहीं खाते)');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
      });

      if (res.success && res.requireVerification) {
        setVerifyTargetEmail(res.email || regEmail);
        setTestOtpCode(res.testOtpCode || null);
        setVerifySuccess(`Verification code dispatched to ${res.email || regEmail}`);
        setResendCooldown(60);
        setActiveView('verify');
      } else if (!res.success) {
        setRegError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setRegError(err.message || 'Registration error occurred.');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // User pasted multi-digit code
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || '';
        }
        setOtpDigits(nextDigits);
        const focusIdx = Math.min(pasted.length, 5);
        otpInputRefs.current[focusIdx]?.focus();
      }
      return;
    }

    const digit = val.replace(/\D/g, '');
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    // Auto-advance
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setVerifyError('Please enter the complete 6-digit verification code.');
      return;
    }

    setVerifyError(null);
    setVerifyLoading(true);

    try {
      const res = await verifyEmail(verifyTargetEmail, fullCode);
      if (!res.success) {
        setVerifyError(res.message || 'Invalid or expired code.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification error.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setVerifyLoading(true);
    setVerifyError(null);

    try {
      const res = await resendVerification(verifyTargetEmail);
      if (res.success) {
        setVerifySuccess('A fresh 6-digit code has been dispatched.');
        if (res.testOtpCode) setTestOtpCode(res.testOtpCode);
        setResendCooldown(60);
      } else {
        setVerifyError(res.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Resend error.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleForgotRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    try {
      const res = await forgotPassword(forgotEmail);
      if (res.success) {
        setForgotSuccess(res.message || 'Reset code sent to your email.');
        if (res.testResetCode) setTestOtpCode(res.testResetCode);
        setActiveView('forgot_reset');
      } else {
        setForgotError(res.message || 'Request failed.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Error occurred.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    setForgotError(null);
    setForgotLoading(true);

    try {
      const res = await resetPassword(forgotEmail, forgotOtp, forgotNewPassword);
      if (res.success) {
        alert('Password reset successful! Please log in with your new password.');
        setActiveView('login');
      } else {
        setForgotError(res.message || 'Reset failed.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Reset error.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden my-8 transition-all">
        {/* Header Bar */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VeyraLogo size="sm" showTagline={false} />
            {isBackendConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Database className="w-2.5 h-2.5" />
                <span>MongoDB Local</span>
              </span>
            )}
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner (If triggered by clicking locked resource) */}
        {authModalNotice && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{authModalNotice}</span>
          </div>
        )}

        {/* Tab Controls (Visible in Login & Register views) */}
        {(activeView === 'login' || activeView === 'register') && (
          <div className="flex border-b border-slate-100 dark:border-slate-800/80 text-xs font-bold">
            <button
              onClick={() => { setActiveView('login'); setLoginError(null); }}
              className={`flex-1 py-3.5 border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeView === 'login'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('common.login')}</span>
            </button>

            <button
              onClick={() => { setActiveView('register'); setRegError(null); }}
              className={`flex-1 py-3.5 border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeView === 'register'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('common.register')}</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: SOPHISTICATED LOGIN FORM */}
        {/* ========================================================= */}
        {activeView === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'पासवर्ड' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setActiveView('forgot_request');
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>{language === 'hi' ? 'मुझे याद रखें' : 'Remember my session'}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>{language === 'hi' ? 'सत्यापित लॉगिन करें' : 'Log In & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SOPHISTICATED REGISTRATION FORM WITH STRENGTH METER */}
        {/* ========================================================= */}
        {activeView === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'ईमेल पता (सत्यापन के लिए प्रयुक्त)' : 'Email Address (Used for Verification)'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Account Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'खाता प्रकार चुनें (Account Type)' : 'Select Account Type'}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('learner')}
                  className={`flex-1 p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    regRole === 'learner'
                      ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/70 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs">
                      {language === 'hi' ? 'विद्यार्थी / छात्र' : 'Student / Learner'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {language === 'hi' ? 'पाठ्यक्रम व क्विज़' : 'Learn & practice'}
                    </div>
                  </div>
                </button>

                <select
                  value={regRole === 'learner' ? '' : regRole}
                  onChange={e => {
                    if (e.target.value) setRegRole(e.target.value as UserRole);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>{language === 'hi' ? 'अन्य भूमिकाएं...' : 'Educator / Admin...'}</option>
                  <option value="content_creator">✍️ Creator / Teacher</option>
                  <option value="branch_admin">🔬 Branch Admin</option>
                </select>
              </div>
            </div>

            {/* Password with live strength meter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'पासवर्ड बनाएं (कम से कम 4 अक्षर)' : 'Create Password (min 4 chars)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter Bar */}
              {regPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Strength:</span>
                    <span className="font-bold">{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${strength.color}`} 
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              </label>
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={regConfirmPassword}
                onChange={e => setRegConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="text-[11px] text-slate-500">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={regAgreedToTerms}
                  onChange={e => setRegAgreedToTerms(e.target.checked)}
                  className="rounded text-indigo-600 mt-0.5"
                />
                <span>
                  {language === 'hi' 
                    ? 'मैं वेयरा सेवा की शर्तों से सहमत हूँ और स्वीकार करता हूँ कि खाते को सक्रिय करने के लिए ईमेल सत्यापन अनिवार्य है।' 
                    : 'I agree to the Veyra Terms of Service and acknowledge email verification is required to activate my account.'}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {regLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'hi' ? 'सत्यापन ओटीपी कोड बनाया जा रहा है...' : 'Generating Verification OTP...'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'hi' ? 'खाता बनाएं एवं सत्यापन कोड भेजें' : 'Create Account & Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SOPHISTICATED 6-DIGIT EMAIL VERIFICATION (OTP) */}
        {/* ========================================================= */}
        {activeView === 'verify' && (
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl shadow-inner border border-indigo-200 dark:border-indigo-800">
                📩
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {language === 'hi' ? 'ईमेल पता सत्यापित करें' : 'Verify Your Email Address'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {language === 'hi' 
                  ? `हमने 6-अंकीय सत्यापन कोड भेजा है:` 
                  : `We have dispatched a 6-digit verification code to:`}
                <span className="block font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                  {verifyTargetEmail}
                </span>
              </p>
            </div>

            {/* Development Helper Banner (Displays OTP for immediate testing) */}
            {testOtpCode && (
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>
                    Test OTP Code: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{testOtpCode}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = testOtpCode.split('').slice(0, 6);
                    setOtpDigits(digits);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 shadow-xs"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            {verifyError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{verifySuccess}</span>
              </div>
            )}

            {/* 6-Box OTP Input Controls */}
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-2xl font-black rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={verifyLoading || otpDigits.join('').length !== 6}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {verifyLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'hi' ? 'कोड सत्यापित किया जा रहा है...' : 'Verifying Code...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{language === 'hi' ? 'सत्यापित करें और आगे बढ़ें' : 'Verify Email & Activate'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Code Options */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold"
              >
                {language === 'hi' ? '← लॉगिन पर वापस जाएं' : '← Back to Login'}
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || verifyLoading}
                onClick={handleResendCode}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0 
                  ? (language === 'hi' ? `${resendCooldown}s में पुनः कोड भेजें` : `Resend code in ${resendCooldown}s`) 
                  : (language === 'hi' ? 'सत्यापन कोड पुनः भेजें' : 'Resend Verification Code')}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: FORGOT PASSWORD REQUEST */}
        {/* ========================================================= */}
        {activeView === 'forgot_request' && (
          <form onSubmit={handleForgotRequestSubmit} className="p-6 space-y-4">
            <div className="text-center space-y-1 pb-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Your Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi' 
                  ? 'पासवर्ड रीसेट ओटीपी प्राप्त करने के लिए अपना पंजीकृत खाता ईमेल दर्ज करें।' 
                  : 'Enter your verified account email to receive a password reset OTP code.'}
              </p>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{forgotError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'खाता ईमेल' : 'Account Email'}
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {forgotLoading 
                ? (language === 'hi' ? 'कोड भेजा जा रहा है...' : 'Sending code...') 
                : (language === 'hi' ? 'पासवर्ड रीसेट कोड भेजें' : 'Send Password Reset Code')}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                {language === 'hi' ? '← लॉगिन पर वापस जाएं' : '← Back to Login'}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: FORGOT PASSWORD ENTER NEW PASSWORD */}
        {/* ========================================================= */}
        {activeView === 'forgot_reset' && (
          <form onSubmit={handleForgotResetSubmit} className="p-6 space-y-4">
            <div className="text-center space-y-1 pb-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'रीसेट कोड और नया पासवर्ड दर्ज करें' : 'Enter Reset Code & New Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi' 
                  ? `6-अंकीय रिकवरी कोड के लिए अपना ईमेल (${forgotEmail}) देखें।` 
                  : `Check your email (${forgotEmail}) for the 6-digit recovery code.`}
              </p>
            </div>

            {testOtpCode && (
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 flex items-center justify-between">
                <span>Test Code: <strong>{testOtpCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setForgotOtp(testOtpCode)}
                  className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold"
                >
                  Use Code
                </button>
              </div>
            )}

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {forgotError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? '6-अंकीय रीसेट कोड' : '6-Digit Reset Code'}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={forgotOtp}
                onChange={e => setForgotOtp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono tracking-widest text-center text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'नया सुरक्षित पासवर्ड' : 'New Secure Password'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={forgotNewPassword}
                onChange={e => setForgotNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              {forgotLoading 
                ? (language === 'hi' ? 'अपडेट किया जा रहा है...' : 'Updating...') 
                : (language === 'hi' ? 'पासवर्ड अपडेट करें और लॉगिन पर जाएं' : 'Update Password & Return to Login')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
