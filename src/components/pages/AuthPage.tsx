import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { VeyraLogo } from '../common/VeyraLogo';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  RefreshCw, 
  Check, 
  KeyRound, 
  Clock, 
  Compass, 
  Atom, 
  GraduationCap, 
  Users, 
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onNavigate?: (page: string) => void;
  onLoginSuccess?: (user?: any) => void;
}

type AuthView = 'login' | 'signup' | 'verify' | 'forgot_request' | 'forgot_reset';

export const AuthPage: React.FC<AuthPageProps> = ({ 
  initialMode = 'login', 
  onNavigate,
  onLoginSuccess 
}) => {
  const { 
    currentUser, 
    login, 
    register, 
    verifyEmail, 
    resendVerification, 
    forgotPassword, 
    resetPassword,
    isBackendConnected 
  } = useAuth();
  const { language, t } = useLanguage();

  const [activeView, setActiveView] = useState<AuthView>(initialMode === 'signup' ? 'signup' : 'login');

  // Update view if initialMode prop changes
  useEffect(() => {
    setActiveView(initialMode === 'signup' ? 'signup' : 'login');
  }, [initialMode]);

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

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If already logged in, show congratulations banner or redirect
  useEffect(() => {
    if (currentUser && onLoginSuccess) {
      onLoginSuccess(currentUser);
    }
  }, [currentUser, onLoginSuccess]);

  // Password Strength Calculation
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

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError(language === 'hi' ? 'कृपया ईमेल और पासवर्ड दर्ज करें।' : 'Please enter both email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (!res.success) {
        if (res.requireVerification) {
          setVerifyTargetEmail(res.email || loginEmail.trim());
          setTestOtpCode(res.testOtpCode || null);
          setActiveView('verify');
          setResendCooldown(45);
        } else {
          setLoginError(res.message || (language === 'hi' ? 'अमान्य क्रेडेंशियल्स।' : 'Invalid credentials. Please try again.'));
        }
      } else {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        } else if (onNavigate) {
          if (res.user?.role === 'super_admin') {
            onNavigate('admin');
          } else if (res.user && res.user.role !== 'learner') {
            onNavigate('content');
          } else {
            onNavigate('dashboard');
          }
        }
      }
    } catch {
      setLoginError(language === 'hi' ? 'लॉगिन में त्रुटि हुई।' : 'An unexpected error occurred during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all mandatory fields.');
      return;
    }

    if (regPassword.length < 4) {
      setRegError(language === 'hi' ? 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' : 'Password must be at least 4 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError(language === 'hi' ? 'पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }

    if (!regAgreedToTerms) {
      setRegError(language === 'hi' ? 'कृपया सेवा की शर्तों को स्वीकार करें।' : 'Please accept terms & privacy policy.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
      });

      if (!res.success) {
        setRegError(res.message || 'Registration failed.');
      } else {
        if (res.requireVerification) {
          setVerifyTargetEmail(res.email || regEmail.trim());
          setTestOtpCode(res.testOtpCode || null);
          setActiveView('verify');
          setResendCooldown(45);
        } else {
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          } else if (onNavigate) {
            onNavigate('dashboard');
          }
        }
      }
    } catch {
      setRegError('An error occurred during account registration.');
    } finally {
      setRegLoading(false);
    }
  };

  // OTP Digits Handling
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      const digits = paste.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifySuccess(null);

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setVerifyError(language === 'hi' ? 'कृपया पूरा 6-अंकीय कोड दर्ज करें।' : 'Please enter the complete 6-digit verification code.');
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await verifyEmail(verifyTargetEmail, code);
      if (!res.success) {
        setVerifyError(res.message || 'Verification failed. Incorrect code.');
      } else {
        setVerifySuccess(language === 'hi' ? 'सत्यापन सफल! आप लॉग इन हो चुके हैं।' : 'Email verified successfully! Logging you in...');
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
          else if (onNavigate) onNavigate('dashboard');
        }, 1200);
      }
    } catch {
      setVerifyError('Verification failed. Please check code or request new one.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await resendVerification(verifyTargetEmail);
      if (res.success) {
        setResendCooldown(45);
        if (res.testOtpCode) setTestOtpCode(res.testOtpCode);
        setVerifySuccess(language === 'hi' ? 'नया सत्यापन कोड भेज दिया गया है।' : 'A fresh 6-digit code has been dispatched.');
      } else {
        setVerifyError(res.message || 'Could not resend code.');
      }
    } catch {
      setVerifyError('Failed to resend code.');
    }
  };

  // Quick One-Click Demo Profiles
  const quickDemoProfiles = [
    {
      role: 'Super Admin (Founder)',
      name: 'Priyanka (प्रियंका)',
      email: 'priyanka@veyra.com',
      pass: 'Admin@123',
      icon: ShieldAlert,
      color: 'purple'
    },
    {
      role: 'Student / Learner',
      name: 'Aarav Patel',
      email: 'aarav.learner@student.edunova.edu',
      pass: 'Student@123',
      icon: GraduationCap,
      color: 'indigo'
    },
    {
      role: 'Content Creator',
      name: 'Vikram Joshi',
      email: 'vikram.creator@edunova.edu',
      pass: 'Creator@123',
      icon: Users,
      color: 'sky'
    },
    {
      role: 'Branch Admin (Science)',
      name: 'Dr. Ananya Roy',
      email: 'ananya.science@edunova.edu',
      pass: 'Branch@123',
      icon: Atom,
      color: 'emerald'
    }
  ];

  const fillQuickDemo = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError(null);
    setActiveView('login');
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRANDING, VALUE PILLARS & 1-CLICK DEMO HUB */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Top Brand Logo */}
            <div className="flex items-center gap-2.5">
              <VeyraLogo size="md" />
              <div>
                <span className="text-xl font-black tracking-tight text-white block">Veyra</span>
                <span className="text-[10px] text-indigo-300 font-mono tracking-wider uppercase block">वेयरा • Active Learning</span>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                {language === 'hi' ? 'ज्ञान की नई दुनिया में प्रवेश करें' : 'See Beyond What You Know.'}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-devanagari">
                {language === 'hi'
                  ? 'शून्य विज्ञापन, 100% व्यावहारिक सिमुलेशन, लाइव कोडिंग सैंडबॉक्स और वैज्ञानिक सिद्धांतों का सीधा अनुभव।'
                  : 'Zero commercial trackers, 100% kinetic simulations, real-time code engines, and deep cognitive retention.'}
              </p>
            </div>

            {/* Security & Feature Badges */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>{language === 'hi' ? 'DPDP अधिनियम 2023: गोपनीयता सुरक्षित' : 'DPDP Act 2023 Privacy-Verified'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Atom className="w-3.5 h-3.5" />
                </div>
                <span>{language === 'hi' ? 'लाइव सिमुलेटर एवं फ्लोचार्ट्स' : 'Interactive Labs & Algorithm Flowcharts'}</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>{language === 'hi' ? 'द्विभाषी ध्वनि उच्चारण व स्पेसड रिकॉल' : 'High-Fidelity Bilingual Phonetics'}</span>
              </div>
            </div>

            {/* Quick 1-Click Demo Profiles */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-300 uppercase">
                  {language === 'hi' ? 'त्वरित 1-क्लिक डेमो लॉगिन:' : '1-Click Test Credentials:'}
                </span>
                <span className="text-[9px] font-mono text-slate-400">Click to Auto-fill</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {quickDemoProfiles.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => fillQuickDemo(p.email, p.pass)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-left transition-all group"
                    >
                      <div className="flex items-center gap-1.5 text-indigo-300 group-hover:text-white text-[11px] font-bold">
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{p.role.split('/')[0]}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate mt-0.5">{p.email}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>© Veyra Learning 2026</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('landing')}
                className="hover:text-white transition-colors flex items-center gap-1 font-bold"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>{language === 'hi' ? 'मुखपृष्ठ' : 'Back to Home'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE AUTH FORM */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          
          {/* Top Switcher Tabs: Log In vs Create Account */}
          {(activeView === 'login' || activeView === 'signup') && (
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 max-w-sm mx-auto w-full">
              <button
                type="button"
                onClick={() => {
                  setActiveView('login');
                  setLoginError(null);
                  if (window.location.pathname !== '/login') {
                    window.history.pushState({ page: 'login' }, '', '/login');
                  }
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeView === 'login'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'लॉग इन (Log In)' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('signup');
                  setRegError(null);
                  if (window.location.pathname !== '/signup') {
                    window.history.pushState({ page: 'signup' }, '', '/signup');
                  }
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeView === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'नया खाता (Sign Up)' : 'Create Account'}</span>
              </button>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* VIEW 1: LOGIN FORM */}
          {/* ----------------------------------------------------------------------- */}
          {activeView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto w-full">
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'वेयरा खाते में लॉग इन करें' : 'Welcome Back'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'hi' ? 'अपनी अध्ययन प्रगति और सिमुलेशन जारी रखें' : 'Sign in to access your simulations, classroom, and streak.'}
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {language === 'hi' ? 'ईमेल पता (Email Address)' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="learner@student.edunova.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveView('forgot_request')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{language === 'hi' ? 'मुझे याद रखें' : 'Remember me on this browser'}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{language === 'hi' ? 'लॉग इन करें' : 'Sign In to Veyra'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* VIEW 2: REGISTER / SIGN UP FORM */}
          {/* ----------------------------------------------------------------------- */}
          {activeView === 'signup' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-w-md mx-auto w-full">
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'नया वेयरा खाता बनाएं' : 'Create Free Account'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'hi' 
                    ? 'निःशुल्क पंजीकरण करें एवं सिमुलेशन में भाग लें' 
                    : 'Join thousands of learners mastering science & code.'}
                </p>
              </div>

              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Account Role Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {language === 'hi' ? 'खाता प्रकार चुनें (Account Type)' : 'Select Account Type'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('learner')}
                    className={`flex-1 p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      regRole === 'learner'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/70 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs">
                        {language === 'hi' ? 'विद्यार्थी / छात्र' : 'Student / Learner'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {language === 'hi' ? 'पाठ्यक्रम व क्विज़' : 'Learn & take quizzes'}
                      </div>
                    </div>
                  </button>

                  <select
                    value={regRole === 'learner' ? '' : regRole}
                    onChange={e => {
                      if (e.target.value) setRegRole(e.target.value as UserRole);
                    }}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>{language === 'hi' ? 'अन्य भूमिकाएं...' : 'Educator / Admin...'}</option>
                    <option value="content_creator">✍️ Content Creator / Teacher</option>
                    <option value="branch_admin">🔬 Branch Admin</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {language === 'hi' ? 'पूरा नाम (Full Name)' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Aarav Patel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {language === 'hi' ? 'ईमेल पता (Email Address)' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="student@student.edunova.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {language === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Strength: {strength.label}</span>
                      <span>{strength.score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regAgreedToTerms}
                    onChange={e => setRegAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {language === 'hi'
                      ? 'मैं वेयरा की सेवा की शर्तों और डिजिटल गोपनीयता नीतियों से सहमत हूँ।'
                      : 'I agree to Veyra\'s Academic Terms & DPDP Act 2023 privacy framework.'}
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {regLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{language === 'hi' ? 'खाता बनाएं एवं शुरू करें' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* VIEW 3: 6-DIGIT OTP VERIFICATION */}
          {/* ----------------------------------------------------------------------- */}
          {activeView === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-5 max-w-md mx-auto w-full text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'ईमेल सत्यापन कोड दर्ज करें' : 'Verify Your Email'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'hi'
                    ? `हमने 6-अंकीय सत्यापन कोड भेजा है: ${verifyTargetEmail}`
                    : `We sent a 6-digit verification code to: ${verifyTargetEmail}`}
                </p>
              </div>

              {testOtpCode && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                  ★ Developer Instant Code: <strong>{testOtpCode}</strong>
                </div>
              )}

              {verifyError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 text-xs">
                  {verifyError}
                </div>
              )}

              {verifySuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 text-xs">
                  {verifySuccess}
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (otpInputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-12 text-center text-lg font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {verifyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify Code & Continue</span>}
              </button>

              <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-2">
                <span>Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResendOtp}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-xs text-slate-400 hover:underline block mx-auto"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* VIEW 4: FORGOT PASSWORD REQUEST */}
          {/* ----------------------------------------------------------------------- */}
          {activeView === 'forgot_request' && (
            <form
              onSubmit={async e => {
                e.preventDefault();
                setForgotError(null);
                setForgotSuccess(null);
                setForgotLoading(true);
                try {
                  const res = await forgotPassword(forgotEmail.trim());
                  if (res.success) {
                    setForgotSuccess('A password recovery code has been sent.');
                    setActiveView('forgot_reset');
                  } else {
                    setForgotError(res.message || 'Email not found.');
                  }
                } catch {
                  setForgotError('Password reset request failed.');
                } finally {
                  setForgotLoading(false);
                }
              }}
              className="space-y-4 max-w-md mx-auto w-full text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Reset Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your registered email address to receive a recovery code.
                </p>
              </div>

              {forgotError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                  {forgotError}
                </div>
              )}

              <div className="relative text-left">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="learner@student.edunova.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30"
              >
                {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Reset Code</span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-xs text-slate-400 hover:underline block mx-auto"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* VIEW 5: FORGOT PASSWORD RESET CONFIRM */}
          {/* ----------------------------------------------------------------------- */}
          {activeView === 'forgot_reset' && (
            <form
              onSubmit={async e => {
                e.preventDefault();
                setForgotError(null);
                setForgotSuccess(null);
                setForgotLoading(true);
                try {
                  const res = await resetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
                  if (res.success) {
                    setForgotSuccess('Password updated successfully! Logging you in...');
                    setTimeout(() => {
                      setActiveView('login');
                    }, 1200);
                  } else {
                    setForgotError(res.message || 'Password reset failed.');
                  }
                } catch {
                  setForgotError('Password reset failed.');
                } finally {
                  setForgotLoading(false);
                }
              }}
              className="space-y-4 max-w-md mx-auto w-full text-center"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Enter New Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the recovery code sent to {forgotEmail} and choose a new password.
                </p>
              </div>

              {forgotError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs">
                  {forgotSuccess}
                </div>
              )}

              <input
                type="text"
                required
                value={forgotOtp}
                onChange={e => setForgotOtp(e.target.value)}
                placeholder="6-digit recovery code"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono text-center"
              />

              <input
                type="password"
                required
                value={forgotNewPassword}
                onChange={e => setForgotNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30"
              >
                {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-xs text-slate-400 hover:underline block mx-auto"
              >
                Back to Sign In
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
