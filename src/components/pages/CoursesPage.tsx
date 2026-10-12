import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ContentNode } from '../../types';
import { CourseBrowser } from '../courses/CourseBrowser';
import { Sparkles, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CoursesPageProps {
  onOpenClassroom: (node: ContentNode) => void;
  onNavigate?: (page: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ onOpenClassroom, onNavigate }) => {
  const { language } = useLanguage();
  const { currentUser, openAuthModal } = useAuth();

  return (
    <div className="space-y-6 py-4">
      {/* Page Title & Mission */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{language === 'hi' ? 'सार्वभौमिक पाठ्यक्रम सूची' : 'Universal Course Offerings'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {language === 'hi' ? 'पाठ्यक्रम एवं विषय पदानुक्रम' : 'What We Deliver in Courses'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-devanagari max-w-3xl leading-relaxed">
          {language === 'hi'
            ? 'प्रत्येक विषय और शाखा का संक्षिप्त विवरण नीचे कार्ड प्रारूप में उपलब्ध है। गहराई से अध्ययन करने, लाइव सिमुलेशन चलाने और कोडिंग अभ्यास के लिए लॉगिन आवश्यक है।'
            : 'Explore our multi-branch curriculum below in card format. Concise overviews are open to preview — an account login is required to access full interactive classrooms, simulation experiments, and save your progress.'}
        </p>
      </div>

      {/* Login Requirement Notice Banner (If not logged in) */}
      {!currentUser ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-indigo-50 to-purple-50 dark:from-amber-950/30 dark:via-indigo-950/30 dark:to-purple-950/20 border border-amber-200/80 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'अध्ययन हेतु लॉगिन आवश्यक है' : 'Account Required for Study Access'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-devanagari">
                {language === 'hi'
                  ? 'आप सभी पाठ्यक्रमों की संक्षिप्त जानकारी देख सकते हैं। किसी भी विषय का अध्ययन शुरू करने के लिए कृपया अपने खाते में लॉगिन करें।'
                  : 'You can preview course delivery overviews freely. To launch interactive labs, code exercises, and track your streak, please sign in.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => openAuthModal('login', 'Please sign in to access course modules and begin studying.')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all self-start sm:self-center whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'अध्ययन हेतु लॉगिन करें' : 'Login to Study'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'hi'
                ? `लॉगिन सक्रिय: ${currentUser.name} — आप सीधे किसी भी पाठ्यक्रम का अध्ययन कर सकते हैं।`
                : `Logged in as ${currentUser.name} — Click any course card to enter your interactive study classroom.`}
            </span>
          </div>
          {currentUser.role === 'learner' && onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors shadow-xs"
            >
              <span>{language === 'hi' ? 'विद्यार्थी डैशबोर्ड पर जाएं' : 'My Student Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Course Cards Browser */}
      <CourseBrowser onOpenClassroom={onOpenClassroom} />
    </div>
  );
};
