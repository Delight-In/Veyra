import React from 'react';
import { ContentNode } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { 
  PlayCircle, Video, BookOpen, HelpCircle, Layers, 
  Clock, CheckCircle2, Bookmark, BookmarkCheck, ArrowRight, Sparkles, Lock, ShieldCheck, Check 
} from 'lucide-react';

interface CourseCardProps {
  node: ContentNode;
  onSelect: (node: ContentNode) => void;
  onOpenClassroom: (node: ContentNode) => void;
  hasChildren: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ node, onSelect, onOpenClassroom, hasChildren }) => {
  const { language } = useLanguage();
  const { isCompleted, isBookmarked, toggleBookmark } = useStudy();
  const { currentUser, isEnrolled, enrollInCourse, canAccessNode, openAuthModal } = useAuth();

  const completed = isCompleted(node.id);
  const bookmarked = isBookmarked(node.id);

  const title = node.translations[language]?.title || node.translations.en?.title || node.id;
  const description = node.translations[language]?.description || node.translations.en?.description || '';
  const hasHindi = !!node.translations.hi?.title;
  const hasEnglish = !!node.translations.en?.title;

  const rootDisciplineId = node.path.split('.')[0];
  const accessCheck = canAccessNode(node);
  const enrolledInTrack = isEnrolled(rootDisciplineId) || isEnrolled(node.id);

  const getTypeIcon = () => {
    switch (node.type) {
      case 'simulation':
        return <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-rose-500" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-500" />;
      case 'category':
      case 'subject':
      case 'topic':
      case 'subtopic':
      case 'sub_subtopic':
        return <Layers className="w-3.5 h-3.5 text-indigo-500" />;
      case 'lesson':
      default:
        return <BookOpen className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  const isInteractiveLeaf = ['simulation', 'video', 'lesson', 'quiz'].includes(node.type);

  const handleAction = () => {
    if (isInteractiveLeaf) {
      if (!currentUser) {
        openAuthModal('login', `Please log in to access ${title}`);
        return;
      }
      onOpenClassroom(node);
    } else {
      onSelect(node);
    }
  };

  const getNodeTypeLabel = (type: string) => {
    if (language === 'hi') {
      switch (type) {
        case 'simulation': return 'सिमुलेशन';
        case 'video': return 'वीडियो';
        case 'lesson': return 'पाठ';
        case 'quiz': return 'प्रश्नोत्तरी';
        case 'category': return 'श्रेणी';
        case 'subject': return 'विषय';
        case 'topic': return 'प्रकरण';
        case 'subtopic': return 'उप-प्रकरण';
        case 'sub_subtopic': return 'सूक्ष्म-प्रकरण';
        default: return type;
      }
    }
    return type.replace('_', ' ');
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card hover:shadow-card-hover hover:border-indigo-300 dark:hover:border-indigo-600/80 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase border border-slate-200/50 dark:border-slate-700/50">
              {getTypeIcon()}
              <span>{getNodeTypeLabel(node.type)}</span>
            </span>

            {/* Access & Enrollment Status Chip */}
            {currentUser?.role === 'super_admin' ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {language === 'hi' ? 'सुपर एडमिन' : 'Super Admin'}
              </span>
            ) : enrolledInTrack ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>{language === 'hi' ? 'नामांकित' : 'Enrolled'}</span>
              </span>
            ) : !currentUser ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>{language === 'hi' ? 'लॉगिन आवश्यक' : 'Login Required'}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {language === 'hi' ? 'निःशुल्क नामांकन' : 'Free Enrollment'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                toggleBookmark(node.id);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
              title={bookmarked 
                ? (language === 'hi' ? 'बुकमार्क हटाएं' : 'Remove Bookmark') 
                : (language === 'hi' ? 'बुकमार्क जोड़ें' : 'Bookmark Topic')}
            >
              {bookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-indigo-600 fill-indigo-100" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 tracking-tight font-devanagari">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-devanagari">
          {description}
        </p>

        {/* Language Badges */}
        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
          {hasHindi && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-devanagari border border-amber-200/60 dark:border-amber-900/40">
              हिन्दी
            </span>
          )}
          {hasEnglish && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 font-mono">
              EN
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{node.estimatedMinutes || 10} {language === 'hi' ? 'मिनट' : 'min'}</span>
        </div>

        <div className="flex items-center gap-2">
          {completed && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400" title={language === 'hi' ? 'पूर्ण हुआ' : 'Completed'}>
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}

          {isInteractiveLeaf ? (
            <button
              onClick={handleAction}
              className={`px-3.5 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 ${
                !currentUser 
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' 
                  : enrolledInTrack 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {!currentUser && <Lock className="w-3 h-3" />}
              <span>
                {!currentUser 
                  ? (language === 'hi' ? 'अध्ययन हेतु लॉगिन' : 'Login to Study') 
                  : enrolledInTrack 
                  ? (language === 'hi' ? 'सीखना शुरू करें' : 'Enter Classroom') 
                  : (language === 'hi' ? 'प्रवेश लें (Free)' : 'Enroll & Start')}
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={() => onSelect(node)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <span>{language === 'hi' ? 'उप-विषय देखें' : 'Drill In'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
