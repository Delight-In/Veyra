import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { ContentNode } from '../../types';
import { SuperAdminDashboard } from '../admin/SuperAdminDashboard';
import { BranchAdminDashboard } from '../admin/BranchAdminDashboard';
import { MediumBlogEditor } from '../admin/MediumBlogEditor';
import { 
  ShieldAlert, UserCheck, Sparkles, PlusCircle, TrendingUp, 
  BookOpen, Search, FileText, Atom, Code, GitFork, Volume2, 
  HelpCircle, Image as ImageIcon, Eye, Edit3, Trash2, CheckCircle2, 
  Clock, ArrowRight, ExternalLink, Layers, Check, GraduationCap, HeartHandshake, Lock, ShieldCheck
} from 'lucide-react';

interface AdminPageProps {
  onNavigate?: (page: string) => void;
  onOpenClassroom?: (node: ContentNode) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, onOpenClassroom }) => {
  const { currentUser, openAuthModal } = useAuth();
  const { nodes, updateNodeStatus, deleteNode } = useContent();
  const { language, t } = useLanguage();

  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'in_review' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditingBlog, setIsEditingBlog] = useState<boolean>(false);

  if (!currentUser) {
    return (
      <div className="py-16 text-center bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-card space-y-6 max-w-xl mx-auto my-8 animate-in fade-in">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-indigo-200/50 dark:border-indigo-800/50">
          🔐
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {language === 'hi' ? 'प्रशासक पोर्टल: प्रमाणीकरण आवश्यक' : 'Admin Portal: Authentication Required'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            {language === 'hi'
              ? 'प्रबंधन कंसोल, शाखा नियंत्रण या कंटेंट क्रिएटर स्टूडियो तक पहुंचने के लिए कृपया अपने क्रेडेंशियल के साथ लॉगिन करें।'
              : 'Sign in with an authorized administrative account to access the administrative dashboard and content management consoles.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => openAuthModal('login', 'Please log in to access administrative consoles.')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
          >
            {t('common.login')}
          </button>
        </div>
      </div>
    );
  }

  // LAYER 1 RESTRICTION: Students strictly blocked from Admin Portal
  if (currentUser.role === 'learner') {
    return (
      <div className="py-16 text-center bg-white dark:bg-[#0F172A] rounded-3xl border border-rose-200/80 dark:border-rose-900/50 p-8 shadow-card space-y-6 max-w-xl mx-auto my-8 animate-in fade-in">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-rose-200/50 dark:border-rose-800/50">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
            Security Isolation Barrier • Layer 1 (Student)
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {language === 'hi' ? 'प्रवेश प्रतिबंधित: शिक्षार्थी खाता सक्रिय' : 'Access Restricted: Student Portal Active'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {language === 'hi'
              ? 'यह खाता शिक्षार्थी (Student) के रूप में पंजीकृत है। प्रशासनिक नियंत्रण, शाखा प्रबंधन और सामग्री निर्माण कंसोल केवल अधिकृत प्रशासकों के लिए आरक्षित हैं।'
              : 'You are signed in as a Student. Administrative operations, branch management, and creator tools are isolated and restricted to authorized platform administrators.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/dashboard')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>{language === 'hi' ? 'विद्यार्थी डैशबोर्ड पर जाएं' : 'Return to Student Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // LAYER 2 RESTRICTION: Parents strictly blocked from Admin Portal
  if (currentUser.role === 'parent') {
    return (
      <div className="py-16 text-center bg-white dark:bg-[#0F172A] rounded-3xl border border-sky-200/80 dark:border-sky-900/50 p-8 shadow-card space-y-6 max-w-xl mx-auto my-8 animate-in fade-in">
        <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-sky-200/50 dark:border-sky-800/50">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            Security Isolation Barrier • Layer 2 (Parent)
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {language === 'hi' ? 'प्रवेश प्रतिबंधित: अभिभावक खाता सक्रिय' : 'Access Restricted: Parent Portal Active'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {language === 'hi'
              ? 'आप अभिभावक (Parent) के रूप में लॉग इन हैं। अपने बच्चे की शैक्षणिक प्रगति, स्क्रीन-टाइम नियंत्रण और क्विज़ स्कोर देखने के लिए कृपया अभिभावक पोर्टल का उपयोग करें।'
              : 'You are signed in as a Parent / Guardian. Administrative operations are isolated. Please visit your Parent Dashboard to monitor your linked children.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate ? onNavigate('parent-dashboard') : (window.location.href = '/parent-dashboard')}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>{language === 'hi' ? 'अभिभावक डैशबोर्ड पर जाएं' : 'Go to Parent Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Branch Admin: Render dedicated BranchAdminDashboard
  if (currentUser.role === 'branch_admin') {
    return (
      <div className="space-y-6 py-4 animate-in fade-in">
        <BranchAdminDashboard onOpenCreateNode={(parentId) => {
          if (typeof window !== 'undefined') {
            const url = parentId ? `/content?create=true&parentId=${encodeURIComponent(parentId)}` : '/content?create=true';
            window.history.pushState(null, '', url);
          }
          if (onNavigate) onNavigate('content');
        }} />
      </div>
    );
  }

  // Content Creator / Content Admin: Dedicated workspace is /content
  if (currentUser.role === 'content_creator' || currentUser.role === 'content_admin') {
    return (
      <div className="py-16 text-center bg-white dark:bg-[#0F172A] rounded-3xl border border-indigo-200/80 dark:border-indigo-900/50 p-8 shadow-card space-y-6 max-w-xl mx-auto my-8 animate-in fade-in">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-indigo-200/50 dark:border-indigo-800/50">
          ✨
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            Content Administrator Workspace • Studio
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {language === 'hi' ? 'सामग्री निर्माण स्टूडियो' : 'Content Creation Studio & Tracking'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {language === 'hi'
              ? 'कंटेंट एडमिन के रूप में आपका समर्पित कार्यक्षेत्र सामग्री निर्माण, सिमुलेशन और ट्रैकिंग है। सभी सुविधाएं /content में उपलब्ध हैं।'
              : 'As a Content Administrator, your dedicated dashboard is Content Studio. Create and format topics, ensure preview accuracy, and submit for branch approval.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate ? onNavigate('content') : (window.location.href = '/content')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>{language === 'hi' ? 'कंटेंट स्टूडियो खोलें' : 'Open Content Studio (/content)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleCreateNewNode = (parentId?: string) => {
    if (typeof window !== 'undefined') {
      const url = (typeof parentId === 'string' && parentId) ? `/content?parentId=${encodeURIComponent(parentId)}` : '/content';
      window.history.pushState(null, '', url);
    }
    if (onNavigate) {
      onNavigate('content');
    }
  };

  return (
    <div className="space-y-8 py-4 animate-in fade-in">
      {/* 1. SUPER ADMIN PROFILE BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {language === 'hi' ? 'सुपर एडमिन' : 'SUPER ADMIN'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {currentUser.email} • {language === 'hi' ? 'सर्वोच्च प्लेटफ़ॉर्म प्राधिकरण' : 'Root Platform Authority'}
            </p>
          </div>
        </div>

        {/* Global Super Admin Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate('admin/create-blog') : setIsEditingBlog(true)}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'hi' ? '📝 + ब्लॉग लिखें (/admin/create-blog)' : '📝 + Write Story (/admin/create-blog)'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCreateNewNode()}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'hi' ? '+ नया विषय नोट बनाएं' : '+ Create Topic Note'}</span>
          </button>

          <button
            type="button"
            onClick={() => openAuthModal('login', language === 'hi' ? 'किसी अन्य अधिकृत व्यवस्थापक खाते से साइन इन करें।' : 'Sign in with another authorized administrator account.')}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {language === 'hi' ? 'खाता बदलें' : 'Switch Account'}
          </button>
        </div>
      </div>

      {/* RENDER SUPER ADMIN DASHBOARD */}
      <SuperAdminDashboard onOpenCreateNode={handleCreateNewNode} onNavigate={onNavigate} />

      {/* Full-Screen Medium Blog Editor Overlay */}
      {isEditingBlog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-[#080C14]">
          <MediumBlogEditor
            onClose={() => setIsEditingBlog(false)}
            onPublished={() => {
              setIsEditingBlog(false);
              if (onNavigate) onNavigate('blogs');
            }}
          />
        </div>
      )}
    </div>
  );
};
