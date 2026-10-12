import React from 'react';
import { ContentNode } from '../../types';
import { useAuth, AccessCheckResult } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Lock, LogIn, UserPlus, Sparkles, CheckCircle2, 
  ArrowRight, BookOpen 
} from 'lucide-react';

interface CourseAccessGateProps {
  node: ContentNode;
  accessCheck: AccessCheckResult;
  onNavigateCourses: () => void;
}

export const CourseAccessGate: React.FC<CourseAccessGateProps> = ({ node, accessCheck, onNavigateCourses }) => {
  const { currentUser, openAuthModal, enrollInCourse } = useAuth();
  const { language, t } = useLanguage();

  const title = node.translations[language]?.title || node.translations.en?.title || node.id;
  const description = node.translations[language]?.description || node.translations.en?.description || '';
  const rootCourseId = node.path.split('.')[0];

  const handleEnroll = () => {
    enrollInCourse(rootCourseId);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-card text-center space-y-6 relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner border border-indigo-200/50 dark:border-indigo-800/50">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase border border-indigo-200/50 dark:border-indigo-800/50">
            {accessCheck.reason === 'needs_login' 
              ? (language === 'hi' ? 'प्रमाणीकरण आवश्यक' : 'AUTHENTICATION REQUIRED')
              : accessCheck.reason === 'needs_enrollment' 
              ? (language === 'hi' ? 'निःशुल्क पाठ्यक्रम नामांकन' : 'FREE COURSE ENROLLMENT')
              : (language === 'hi' ? 'पहुँच नियंत्रित' : 'ACCESS CONTROLLED')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-devanagari">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed font-devanagari">
            {description}
          </p>
        </div>

        {/* Dynamic Action Box based on reason */}
        <div className="pt-2">
          {accessCheck.reason === 'needs_login' && (
            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-xs text-slate-600 dark:text-slate-300 font-devanagari">
                {language === 'hi'
                  ? 'इस पाठ्यक्रम की सिमुलेशन, वीडियो चेकपॉइंट्स और नोट्स का उपयोग करने के लिए कृपया लॉग इन करें।'
                  : 'Sign in to access interactive physics simulations, video pause checkpoints, personal notes, and certificates.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => openAuthModal('login', `Please log in to start learning ${title}`)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'hi' ? 'कक्षा में प्रवेश हेतु लॉगिन करें' : 'Log In to Enter Classroom'}</span>
                </button>

                <button
                  onClick={() => openAuthModal('register', `Create a free account to enter ${title}`)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'निःशुल्क खाता बनाएं' : 'Sign Up Free'}</span>
                </button>
              </div>
            </div>
          )}

          {accessCheck.reason === 'needs_enrollment' && (
            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-xs text-slate-600 dark:text-slate-300 font-devanagari">
                {language === 'hi'
                  ? `आप ${currentUser?.name} के रूप में लॉग इन हैं। इस पाठ्यक्रम में निःशुल्क प्रवेश लें।`
                  : `You are signed in as ${currentUser?.name}. Click below to enroll free and begin mastering this subject.`}
              </p>

              <button
                onClick={handleEnroll}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {language === 'hi' ? 'निःशुल्क प्रवेश लें (Enroll Now Free)' : 'Enroll in Track Free (Instant Access)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {accessCheck.reason === 'draft_restricted' && (
            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 font-devanagari">
                {accessCheck.message}
              </p>

              <div className="flex items-center justify-center">
                <button
                  onClick={() => openAuthModal('login', 'Sign in with educator or administrator credentials to preview draft nodes.')}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                >
                  {language === 'hi' ? 'प्रशासक खाते से लॉगिन करें' : 'Sign In with Administrator Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Curriculum Preview */}
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-devanagari">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>{language === 'hi' ? 'पाठ्यक्रम रूपरेखा एवं शामिल इंटरैक्टिव मॉड्यूल' : 'Course Syllabus & Included Interactive Modules'}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {language === 'hi' ? 'अनुमानित' : 'Est.'} {node.estimatedMinutes || 45} {language === 'hi' ? 'मिनट' : 'mins'}
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-devanagari">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{language === 'hi' ? 'हिन्दी (देवनागरी) और अंग्रेजी में द्विभाषी वैचारिक व्युत्पत्ति' : 'Bilingual conceptual derivations in Hindi (देवनागरी) and English'}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{language === 'hi' ? 'रीयल-टाइम पैरामीटर ट्यूनिंग के साथ इंटरैक्टिव HTML5 कैनवास सिम्युलेटर' : 'Interactive HTML5 Canvas simulator with real-time parameter tuning'}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{language === 'hi' ? 'इंटरैक्टिव चेकपॉइंट प्रतिधारण क्विज़ के साथ संकल्पना वीडियो' : 'Concept video with interactive checkpoint retention quizzes'}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{language === 'hi' ? 'स्मरण रेटिंग और प्रगति बचत के साथ स्पेस्ड पुनरावृत्ति फ्लैशकार्ड' : 'Spaced repetition flashcards with recall rating & progress saving'}</span>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onNavigateCourses}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline font-devanagari"
          >
            {language === 'hi' ? '← पाठ्यक्रम निर्देशिका पर वापस जाएं' : '← Back to Course Directory'}
          </button>
        </div>
      </div>
    </div>
  );
};
