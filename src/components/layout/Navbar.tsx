import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useStudy } from '../../context/StudyContext';
import { 
  Globe, Sun, Moon, Flame, Zap, UserCheck, Menu, X, 
  BookOpen, Compass, HeartHandshake, LogOut, ChevronDown, Check, LogIn, UserPlus, Bell, ArrowRight,
  GraduationCap, Atom, ShieldAlert, Sparkles, LayoutDashboard, GitBranch, ShieldCheck
} from 'lucide-react';
import { VeyraLogo } from '../common/VeyraLogo';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { 
    currentUser, isAuthenticated, logout, openAuthModal, markNotificationAsRead 
  } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { userXp, streakDays } = useStudy();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

  // Unread notifications for the active user
  const unreadCount = (currentUser?.notifications || []).filter(n => !n.read).length;

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isBranchAdmin = currentUser?.role === 'branch_admin';
  const isContentAdmin = currentUser?.role === 'content_admin' || currentUser?.role === 'content_creator' || currentUser?.role === 'reviewer';
  const showParentPortal = currentUser && currentUser.role === 'parent';
  const isLearner = currentUser?.role === 'learner';

  const handlePortalSwitch = (roleTarget: 'user' | 'parent' | 'admins') => {
    setLoginDropdownOpen(false);
    if (currentUser) {
      if (roleTarget === 'user') {
        onNavigate('dashboard');
      } else if (roleTarget === 'parent') {
        onNavigate('parent-dashboard');
      } else if (isBranchAdmin || isSuperAdmin) {
        onNavigate('admin');
      } else {
        onNavigate('content');
      }
      return;
    }

    if (roleTarget === 'user') {
      openAuthModal('login', 'Sign in to access your learning dashboard and simulations.');
    } else if (roleTarget === 'parent') {
      openAuthModal('login', 'Sign in as a parent/guardian to monitor student progress.');
    } else {
      openAuthModal('login', 'Sign in with administrator credentials.');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090D16]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. BRAND LOGO */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (showParentPortal) {
                  onNavigate('parent-dashboard');
                } else if (isSuperAdmin || isBranchAdmin) {
                  onNavigate('admin');
                } else if (isContentAdmin) {
                  onNavigate('content');
                } else if (currentUser) {
                  onNavigate('dashboard');
                } else {
                  onNavigate('landing');
                }
              }}
              className="flex items-center group text-left transition-transform hover:opacity-95"
              title="Veyra — See beyond what you know."
            >
              <VeyraLogo size="sm" showTagline={true} />
            </button>
          </div>

          {/* 2. NAVIGATION TABS (Landing tabs removed after login) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {/* PUBLIC / LOGGED OUT TABS */}
            {!currentUser ? (
              <>
                <button
                  onClick={() => onNavigate('about')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === 'about'
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('nav.about')}
                </button>

                <button
                  onClick={() => onNavigate('blogs')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentPage === 'blogs'
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'hi' ? 'आलेख व ब्लॉग' : 'Blogs & Articles'}</span>
                </button>

                <button
                  onClick={() => onNavigate('contact')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === 'contact'
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('nav.contact')}
                </button>
              </>
            ) : (
              /* AUTHENTICATED TABS - Tailored directly to logged-in user role */
              <>
                {/* 1. Super Admin: Admin Portal, Content Studio, Simulations */}
                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => onNavigate('admin')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentPage === 'admin'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t('nav.adminPortal')}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('content')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentPage === 'content'
                          ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>{t('nav.contentStudio')}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('blogs')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentPage === 'blogs'
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{language === 'hi' ? 'आलेख (Blogs)' : 'Blogs'}</span>
                    </button>
                  </>
                )}

                {/* 2. Branch Admin: Branch Admin Portal & Content Overview */}
                {isBranchAdmin && (
                  <>
                    <button
                      onClick={() => onNavigate('admin')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentPage === 'admin'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === 'hi' ? 'शाखा व्यवस्थापक पोर्टल' : 'Branch Admin Portal'}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('content')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentPage === 'content'
                          ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>{language === 'hi' ? 'सामग्री स्टूडियो' : 'Content Studio'}</span>
                    </button>
                  </>
                )}

                {/* 3. Content Admin / Creator: Exclusively Content Studio & Classroom Studio */}
                {isContentAdmin && (
                  <>
                    <button
                      onClick={() => onNavigate('content')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentPage === 'content'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === 'hi' ? 'कंटेंट स्टूडियो' : 'Content Studio'}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('classroom')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentPage === 'classroom'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t('nav.classroomStudio')}</span>
                    </button>
                  </>
                )}

                {/* 3. Parent / Guardian */}
                {showParentPortal && (
                  <button
                    onClick={() => onNavigate('parent-dashboard')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentPage === 'parent-dashboard'
                        ? 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 shadow-xs ring-1 ring-sky-300/80 dark:ring-sky-700/80'
                        : 'text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-50/50 dark:hover:bg-sky-950/30'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-sky-500" />
                    <span>{t('nav.parentPortal')}</span>
                  </button>
                )}

                {/* 4. Student / Learner */}
                {isLearner && (
                  <button
                    onClick={() => onNavigate('blogs')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      currentPage === 'blogs'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'hi' ? 'आलेख व ब्लॉग' : 'Blogs'}</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* 3. RIGHT CONTROLS: LANGUAGE + DARK/BRIGHT + NOTIFICATIONS + LOGIN */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-card"
              title="Toggle Language: Hindi (देवनागरी) / English"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'hi' ? '🇮🇳 हिन्दी' : '🇬🇧 English'}</span>
            </button>

            {/* Dark / Bright Mode Switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Dark / Bright Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* NOTIFICATIONS BELL (FOR MESSAGES SENT BY SUPER ADMIN) */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  title={language === 'hi' ? 'प्रशासनिक सूचनाएं' : 'Administrative Notifications'}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-devanagari">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {language === 'hi' ? 'प्रशासक संदेश' : 'Admin Direct Messages'}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {unreadCount} {language === 'hi' ? 'अपठित' : 'Unread'}
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-2 space-y-2">
                      {(!currentUser.notifications || currentUser.notifications.length === 0) ? (
                        <div className="p-4 text-center text-xs text-slate-400 italic font-devanagari">
                          {language === 'hi' ? 'इनबॉक्स में कोई संदेश नहीं है।' : 'No messages in inbox.'}
                        </div>
                      ) : (
                        currentUser.notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-all ${
                              notif.read
                                ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white font-semibold'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{notif.sender}</span>
                              <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="font-bold text-xs">{notif.title}</div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AUTHENTICATION CONTROLS: DIRECT LOGIN & SIGNUP BUTTONS */}
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentPage === 'login'
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-black'
                      : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'लॉग इन' : 'Sign In'}</span>
                </button>

                <button
                  onClick={() => onNavigate('signup')}
                  className={`px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 ${
                    currentPage === 'signup' ? 'ring-2 ring-indigo-400' : ''
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'निःशुल्क शुरू करें' : 'Sign Up Free'}</span>
                </button>
              </div>
            ) : (
              /* LOGGED IN ACTIVE USER PROFILE MENU */
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-card"
                  aria-label="User Account Menu"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500"
                  />
                  <div className="text-left text-[11px] leading-tight hidden xl:block">
                    <div className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px]">
                      {currentUser.name}
                    </div>
                    <div className="text-slate-400 uppercase text-[9px] font-mono tracking-wider">
                      {currentUser.role.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 space-y-3">
                    {/* User Profile Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500 flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    {/* Account Details Badges */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 space-y-1.5 text-xs font-devanagari">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-mono uppercase font-bold">
                          {language === 'hi' ? 'भूमिका:' : 'Role:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                          {currentUser.role === 'super_admin'
                            ? (language === 'hi' ? 'सुपर एडमिन' : 'SUPER ADMIN')
                            : currentUser.role === 'branch_admin'
                            ? (language === 'hi' ? 'शाखा व्यवस्थापक' : 'BRANCH ADMIN')
                            : currentUser.role === 'content_admin'
                            ? (language === 'hi' ? 'कंटेंट व्यवस्थापक' : 'CONTENT ADMIN')
                            : currentUser.role === 'content_creator'
                            ? (language === 'hi' ? 'कंटेंट क्रिएटर' : 'CONTENT CREATOR')
                            : currentUser.role === 'reviewer'
                            ? (language === 'hi' ? 'समीक्षक' : 'REVIEWER')
                            : currentUser.role === 'student' || currentUser.role === 'learner'
                            ? (language === 'hi' ? 'विद्यार्थी' : 'STUDENT')
                            : (language === 'hi' ? 'अभिभावक' : 'PARENT')}
                        </span>
                      </div>
                      {currentUser.studentId && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] font-mono uppercase font-bold">
                            {language === 'hi' ? 'छात्र आईडी:' : 'Student ID:'}
                          </span>
                          <span className="font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                            {currentUser.studentId}
                          </span>
                        </div>
                      )}
                      {currentUser.assignedBranchName && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] font-mono uppercase font-bold">
                            {language === 'hi' ? 'शाखा:' : 'Branch:'}
                          </span>
                          <span className="font-semibold text-[10px] text-purple-600 dark:text-purple-400 truncate max-w-[130px]">
                            {currentUser.assignedBranchName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="space-y-1 font-devanagari">
                      {isLearner ? (
                        <>
                          <button
                            onClick={() => {
                              onNavigate('dashboard');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center gap-2"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'विद्यार्थी डैशबोर्ड' : 'Student Dashboard'}</span>
                          </button>
                        </>
                      ) : isSuperAdmin ? (
                        <>
                          <button
                            onClick={() => {
                              onNavigate('admin');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                          >
                            {language === 'hi' ? 'सुपर एडमिन कंसोल (/admin)' : 'Super Admin Console (/admin)'}
                          </button>
                          <button
                            onClick={() => {
                              onNavigate('admin/create-blog');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{language === 'hi' ? 'ब्लॉग बनाएं (/admin/create-blog)' : 'Write Story (/admin/create-blog)'}</span>
                          </button>
                          <button
                            onClick={() => {
                              onNavigate('content');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            {language === 'hi' ? 'सामग्री स्टूडियो (/content)' : 'Content Studio (/content)'}
                          </button>
                        </>
                      ) : isBranchAdmin ? (
                        <>
                          <button
                            onClick={() => {
                              onNavigate('admin');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center gap-2"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'शाखा व्यवस्थापक पोर्टल (/admin)' : 'Branch Admin Portal (/admin)'}</span>
                          </button>
                          <button
                            onClick={() => {
                              onNavigate('content');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'सामग्री समीक्षा (/content)' : 'Content Review (/content)'}</span>
                          </button>
                        </>
                      ) : isContentAdmin ? (
                        <>
                          <button
                            onClick={() => {
                              onNavigate('content');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'कंटेंट एडमिन स्टूडियो (/content)' : 'Content Admin Studio (/content)'}</span>
                          </button>
                          <button
                            onClick={() => {
                              onNavigate('classroom');
                              setRoleDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'कक्षा स्टूडियो (/classroom)' : 'Classroom (/classroom)'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            onNavigate('parent-dashboard');
                            setRoleDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/50 text-sky-700 dark:text-sky-300 transition-colors flex items-center gap-2"
                        >
                          <HeartHandshake className="w-3.5 h-3.5 text-sky-500" />
                          <span>{language === 'hi' ? 'अभिभावक डैशबोर्ड' : 'Parent Dashboard'}</span>
                        </button>
                      )}
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setRoleDropdownOpen(false);
                          onNavigate('landing');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MOBILE MENU TOGGLE BUTTON */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {language === 'hi' ? '🇮🇳' : '🇬🇧'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-1">
            {!currentUser ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('about');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPage === 'about'
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('nav.about')}
                </button>
                {currentPage === 'landing' && (
                  <button
                    onClick={() => {
                      onNavigate('simulations');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors text-slate-700 dark:text-slate-300"
                  >
                    {t('nav.simulations')}
                  </button>
                )}
                <button
                  onClick={() => {
                    onNavigate('blogs');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                    currentPage === 'blogs'
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'hi' ? 'सुपर एडमिन आलेख (Blogs)' : 'Super Admin Blogs'}</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('contact');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentPage === 'contact'
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('nav.contact')}
                </button>
              </>
            ) : (
              <>
                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                        currentPage === 'admin'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-indigo-500" />
                      <span>{t('nav.adminPortal')}</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('content');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                        currentPage === 'content'
                          ? 'text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>{language === 'hi' ? 'सामग्री स्टूडियो (/content)' : 'Content Studio (/content)'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('blogs');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                        currentPage === 'blogs'
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>{language === 'hi' ? 'सुपर एडमिन ब्लॉग (/blogs)' : 'Super Admin Blogs (/blogs)'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('admin/create-blog');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                        currentPage === 'admin-createblog'
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 font-bold'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>{language === 'hi' ? 'ब्लॉग बनाएं (/admin/create-blog)' : 'Write Story (/admin/create-blog)'}</span>
                    </button>
                  </>
                )}

                {isBranchAdmin && (
                  <>
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                        currentPage === 'admin'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <GitBranch className="w-4 h-4 text-indigo-500" />
                      <span>{language === 'hi' ? 'शाखा व्यवस्थापक पोर्टल (/admin)' : 'Branch Admin Portal (/admin)'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('content');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                        currentPage === 'content'
                          ? 'text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/60 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>{language === 'hi' ? 'सामग्री स्टूडियो (/content)' : 'Content Studio (/content)'}</span>
                    </button>
                  </>
                )}

                {isContentAdmin && (
                  <>
                    <button
                      onClick={() => {
                        onNavigate('content');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                        currentPage === 'content'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>{language === 'hi' ? 'कंटेंट एडमिन स्टूडियो (/content)' : 'Content Admin Studio (/content)'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('classroom');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                        currentPage === 'classroom'
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>{language === 'hi' ? 'कक्षा स्टूडियो (/classroom)' : 'Classroom Studio (/classroom)'}</span>
                    </button>
                  </>
                )}

                {showParentPortal && (
                  <button
                    onClick={() => {
                      onNavigate('parent-dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                      currentPage === 'parent-dashboard'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 font-bold'
                        : 'text-sky-700 dark:text-sky-300'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>{t('nav.parentPortal')}</span>
                  </button>
                )}
              </>
            )}

            {currentUser ? (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500" />
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs truncate text-slate-900 dark:text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{currentUser.role.replace('_', ' ')}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    onNavigate('landing');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'hi' ? 'लॉग इन करें' : 'Sign In'}</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'नया खाता बनाएं (Sign Up)' : 'Create Free Account'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
