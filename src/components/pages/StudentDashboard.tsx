import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { useStudy } from '../../context/StudyContext';
import { useLanguage } from '../../context/LanguageContext';
import { ContentNode } from '../../types';
import { 
  BookOpen, Sparkles, Compass, CheckCircle2, Flame, Zap, Clock, 
  ArrowRight, Search, Filter, Layers, PlayCircle, Code2, 
  Award, Check, Plus, Trash2, ChevronDown, ChevronUp, Lock,
  GraduationCap, Rocket, RefreshCw, X, ShieldCheck, ShieldAlert
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenClassroom: (node?: ContentNode) => void;
  onNavigate: (page: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  onOpenClassroom, 
  onNavigate 
}) => {
  const { currentUser, isEnrolled, enrollInCourse, unenrollCourse, openAuthModal } = useAuth();
  const { nodes, getChildNodes, getDescendantNodes, getNodeById } = useContent();
  const { progressMap, isCompleted, userXp, streakDays, completedCount } = useStudy();
  const { language } = useLanguage();

  // Tab State: 'my-courses' vs 'all-courses'
  const [activeTab, setActiveTab] = useState<'my-courses' | 'all-courses'>('my-courses');

  // Filters for All Courses tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filters for My Courses tab
  const [myCourseSearch, setMyCourseSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');

  // Notification Toast for instant feedback on enrollment
  const [enrollToast, setEnrollToast] = useState<{
    show: boolean;
    title: string;
    courseNode: ContentNode;
  } | null>(null);

  // Unenroll Confirmation Modal State
  const [unenrollTarget, setUnenrollTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Expanded Syllabus accordion state
  const [expandedSyllabusId, setExpandedSyllabusId] = useState<string | null>(null);

  // 1. Gather all primary/root courses and admin-created offerings available on the platform
  const allPrimaryCourses = useMemo(() => {
    const map = new Map<string, ContentNode>();

    // A. Root published categories and primary courses (parentId is null or empty)
    nodes
      .filter(n => (!n.parentId || n.parentId === '') && n.status === 'published')
      .forEach(n => map.set(n.id, n));

    // B. High-level published subjects & categories under tracks
    nodes
      .filter(n => (n.type === 'subject' || n.type === 'category') && n.status === 'published')
      .forEach(n => {
        if (!map.has(n.id)) map.set(n.id, n);
      });

    // C. Major published topics
    nodes
      .filter(n => n.type === 'topic' && n.status === 'published')
      .forEach(n => {
        if (!map.has(n.id)) map.set(n.id, n);
      });

    // D. ANY course/lesson/simulation explicitly authored or added by an administrator or educator
    // (If an admin authored a custom module/course, it MUST be available for student exploration & enrollment)
    nodes
      .filter(n => n.status === 'published' && (
        (n.createdBy && n.createdBy !== 'user_super_admin') ||
        n.depth <= 2 ||
        n.parentId === 'node_mechanics' ||
        n.parentId === 'node_physics' ||
        n.parentId === 'node_cs' ||
        n.parentId === 'node_science' ||
        n.parentId === 'node_math' ||
        Boolean(n.simulationConfig) ||
        Boolean(n.codingProblem)
      ))
      .forEach(n => {
        if (!map.has(n.id)) map.set(n.id, n);
      });

    // E. Ensure all courses the learner is currently enrolled in are present in the catalog
    if (currentUser?.enrolledCourseIds) {
      currentUser.enrolledCourseIds.forEach(enrolledId => {
        const found = getNodeById(enrolledId);
        if (found && !map.has(found.id)) {
          map.set(found.id, found);
        }
      });
    }

    return Array.from(map.values());
  }, [nodes, currentUser]);

  // Helper to calculate course progress details
  const getCourseProgressData = (courseId: string) => {
    const course = getNodeById(courseId);
    if (!course) return { totalLessons: 0, completedLessons: 0, percent: 0, firstLeaf: undefined };

    const descendants = getDescendantNodes(courseId);
    const leafNodes = descendants.filter(d => 
      ['lesson', 'simulation', 'quiz', 'video'].includes(d.type) || 
      getChildNodes(d.id).length === 0
    );

    const effectiveItems = leafNodes.length > 0 ? leafNodes : [course];
    const completedItems = effectiveItems.filter(item => isCompleted(item.id));
    const percent = effectiveItems.length > 0 
      ? Math.round((completedItems.length / effectiveItems.length) * 100) 
      : 0;

    // Find the first uncompleted leaf or first leaf to resume
    const firstUncompleted = effectiveItems.find(item => !isCompleted(item.id));
    const firstLeaf = firstUncompleted || effectiveItems[0] || course;

    return {
      totalLessons: effectiveItems.length,
      completedLessons: completedItems.length,
      percent,
      firstLeaf
    };
  };

  // 2. Compute Enrolled Courses for current user
  const enrolledCourses = useMemo(() => {
    if (!currentUser) return [];
    const userEnrolledIds = currentUser.enrolledCourseIds || [];

    // Map directly from enrolled IDs so ANY enrolled node is guaranteed to appear
    const directEnrolledNodes: ContentNode[] = [];
    userEnrolledIds.forEach(id => {
      const found = getNodeById(id);
      if (found) {
        directEnrolledNodes.push(found);
      }
    });

    // Also match if course materialized path root or ID is enrolled
    allPrimaryCourses.forEach(course => {
      const rootId = course.path.split('.')[0];
      if (userEnrolledIds.includes(rootId) || userEnrolledIds.includes(course.id)) {
        if (!directEnrolledNodes.some(d => d.id === course.id)) {
          directEnrolledNodes.push(course);
        }
      }
    });

    return directEnrolledNodes.map(course => {
      const stats = getCourseProgressData(course.id);
      return {
        course,
        ...stats,
        status: stats.percent === 100 ? 'completed' : stats.percent > 0 ? 'in_progress' : 'not_started'
      };
    });
  }, [currentUser, allPrimaryCourses, nodes, progressMap]);

  // 3. Filter My Courses based on search & status filter
  const filteredMyCourses = useMemo(() => {
    return enrolledCourses.filter(item => {
      const title = item.course.translations[language]?.title || item.course.translations.en?.title || item.course.id;
      const desc = item.course.translations[language]?.description || item.course.translations.en?.description || '';

      if (myCourseSearch.trim()) {
        const q = myCourseSearch.toLowerCase();
        if (!title.toLowerCase().includes(q) && !desc.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [enrolledCourses, myCourseSearch, statusFilter, language]);

  // 4. Filter All Courses based on search, category, age band
  const filteredAllCourses = useMemo(() => {
    return allPrimaryCourses.filter(course => {
      const title = course.translations[language]?.title || course.translations.en?.title || course.id;
      const desc = course.translations[language]?.description || course.translations.en?.description || '';

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tagMatches = (course.tags || []).some(t => t.toLowerCase().includes(q));
        if (!title.toLowerCase().includes(q) && !desc.toLowerCase().includes(q) && !tagMatches) {
          return false;
        }
      }

      if (selectedCategory !== 'all') {
        const catKey = selectedCategory.toLowerCase();
        const pathMatches = course.path.toLowerCase().includes(catKey);
        const tagMatches = (course.tags || []).some(t => t.toLowerCase().includes(catKey));
        const titleMatches = (course.translations.en?.title || '').toLowerCase().includes(catKey) ||
                             (course.translations.hi?.title || '').toLowerCase().includes(catKey);
        const parentNode = course.parentId ? getNodeById(course.parentId) : undefined;
        const parentMatches = parentNode && (parentNode.path.toLowerCase().includes(catKey) || (parentNode.translations.en?.title || '').toLowerCase().includes(catKey));
        if (!pathMatches && !tagMatches && !titleMatches && !parentMatches) {
          return false;
        }
      }

      return true;
    });
  }, [allPrimaryCourses, searchQuery, selectedCategory, language, nodes]);

  // Most recently active enrolled course to resume
  const resumeCourseItem = useMemo(() => {
    if (enrolledCourses.length === 0) return null;
    const inProgress = enrolledCourses.find(c => c.percent > 0 && c.percent < 100);
    return inProgress || enrolledCourses[0] || null;
  }, [enrolledCourses]);

  // Handle Enrollment
  const handleEnroll = (course: ContentNode) => {
    if (!currentUser) {
      openAuthModal('login', 'Please sign in to enroll in courses.');
      return;
    }

    enrollInCourse(course.id);
    const title = course.translations[language]?.title || course.translations.en?.title || course.id;
    setEnrollToast({
      show: true,
      title,
      courseNode: course
    });

    // Auto-hide toast after 6 seconds
    setTimeout(() => {
      setEnrollToast(prev => (prev?.title === title ? null : prev));
    }, 6000);
  };

  // Handle Unenroll Confirm
  const handleConfirmUnenroll = () => {
    if (!unenrollTarget) return;
    unenrollCourse(unenrollTarget.id);
    setUnenrollTarget(null);
  };

  // Student Level calculation
  const studentLevel = Math.max(1, Math.floor((userXp || 0) / 400) + 1);

  // If not authenticated, prompt to sign in
  if (!currentUser) {
    return (
      <div className="py-16 text-center space-y-5 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-3xl shadow-sm">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {language === 'hi' ? 'विद्यार्थी डैशबोर्ड में लॉगिन करें' : 'Sign in to Access Student Dashboard'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-devanagari leading-relaxed">
          {language === 'hi'
            ? 'अपने नामांकित पाठ्यक्रमों को देखने, प्रगति ट्रैक करने और नए विषयों में प्रवेश लेने के लिए कृपया अपने विद्यार्थी खाते में प्रवेश करें।'
            : 'Access your enrolled courses, keep your study streak active, and enroll in interactive physics and coding tracks.'}
        </p>
        <button
          onClick={() => openAuthModal('login', 'Please sign in to view your Student Dashboard.')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 mx-auto transition-all"
        >
          <Lock className="w-4 h-4" />
          <span>{language === 'hi' ? 'लॉग इन करें' : 'Sign In Now'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ADMINISTRATIVE ISOLATION: Administrators redirected to Admin Portal
  if (currentUser.role !== 'learner') {
    return (
      <div className="py-16 text-center bg-white dark:bg-[#0F172A] rounded-3xl border border-indigo-200/80 dark:border-indigo-900/50 p-8 shadow-card space-y-6 max-w-xl mx-auto my-8 animate-in fade-in">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-indigo-200/50 dark:border-indigo-800/50">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            Administrative Session Active
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {language === 'hi' ? 'व्यवस्थापक सत्र सक्रिय' : 'Administrator Session Active'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {language === 'hi'
              ? 'आप व्यवस्थापक के रूप में लॉग इन हैं। सामग्री प्रबंधन, शाखा नियंत्रण या परिचालन कार्य देखने के लिए कृपया व्यवस्थापक पोर्टल पर जाएं।'
              : 'You are signed in with an administrative profile. The Student Dashboard is intended for student coursework. Please return to the Administrator Console.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('admin')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>{language === 'hi' ? 'प्रशासक पोर्टल पर जाएं' : 'Go to Administrator Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. ENROLLMENT CELEBRATION TOAST */}
      {/* ========================================================================= */}
      {enrollToast && enrollToast.show && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 flex items-center justify-between gap-4 animate-slideDown">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                {language === 'hi' ? 'नामांकन सफल! 🎉' : 'Course Enrolled Successfully! 🎉'}
              </h4>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-devanagari mt-0.5">
                {language === 'hi'
                  ? `आप "${enrollToast.title}" में नामांकित हो गए हैं। यह अब "मेरे पाठ्यक्रम" में उपलब्ध है।`
                  : `You are now enrolled in "${enrollToast.title}". You can start studying right away!`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const target = getCourseProgressData(enrollToast.courseNode.id).firstLeaf || enrollToast.courseNode;
                onOpenClassroom(target);
                setEnrollToast(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सीखना शुरू करें' : 'Start Learning'}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('my-courses');
                setEnrollToast(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
            >
              {language === 'hi' ? 'मेरे पाठ्यक्रम देखें' : 'View My Courses'}
            </button>
            <button
              onClick={() => setEnrollToast(null)}
              className="p-1 rounded-lg text-emerald-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WELCOME BANNER & STUDENT OVERVIEW */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar & Greeting */}
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-lg shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {language === 'hi' ? 'विद्यार्थी' : 'Student Learner'}
                </span>
                {currentUser.studentId && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ID: {currentUser.studentId}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {language === 'hi' ? `स्तर ${studentLevel}` : `Level ${studentLevel} Explorer`}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                {language === 'hi' 
                  ? `स्वागत है, ${currentUser.name}!` 
                  : `Welcome back, ${currentUser.name}!`}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-devanagari max-w-xl leading-relaxed">
                {language === 'hi'
                  ? 'अपने अध्ययन की प्रगति ट्रैक करें, नामांकित पाठ्यक्रम जारी रखें या नए विषयों की खोज करके प्रवेश लें।'
                  : 'Manage your enrolled courses, track completion metrics, and discover exciting interactive science and coding tracks.'}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Button */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              onClick={() => setActiveTab('all-courses')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-102 active:scale-98"
            >
              <Compass className="w-4 h-4" />
              <span>{language === 'hi' ? 'सभी पाठ्यक्रम खोजें' : 'Explore All Courses'}</span>
            </button>
          </div>
        </div>

        {/* Gamified Stats Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">{enrolledCourses.length}</div>
              <div className="text-[10px] text-slate-400 font-devanagari">
                {language === 'hi' ? 'नामांकित पाठ्यक्रम' : 'Enrolled Courses'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">{completedCount}</div>
              <div className="text-[10px] text-slate-400 font-devanagari">
                {language === 'hi' ? 'पूर्ण किए गए विषय' : 'Topics Mastered'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">{streakDays} {language === 'hi' ? 'दिन' : 'Days'}</div>
              <div className="text-[10px] text-slate-400 font-devanagari">
                {language === 'hi' ? 'अध्ययन लड़ी (Streak)' : 'Daily Streak'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">{userXp} XP</div>
              <div className="text-[10px] text-slate-400 font-devanagari">
                {language === 'hi' ? 'कुल अर्जित अंक' : 'Total Knowledge XP'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RESUME BANNER (If student has an enrolled course in progress) */}
      {/* ========================================================================= */}
      {resumeCourseItem && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  {language === 'hi' ? 'अध्ययन जारी रखें' : 'Continue Learning'}
                </span>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {resumeCourseItem.percent}% {language === 'hi' ? 'पूर्ण' : 'Completed'}
                </span>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">
                {resumeCourseItem.course.translations[language]?.title || resumeCourseItem.course.translations.en?.title || resumeCourseItem.course.id}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Progress bar */}
            <div className="flex-1 md:w-36">
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${resumeCourseItem.percent}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => {
                const target = resumeCourseItem.firstLeaf || resumeCourseItem.course;
                onOpenClassroom(target);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'आगे पढ़ें' : 'Resume Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN NAVIGATION TABS: "MY COURSES" vs "ALL COURSES" */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {/* Tab 1: My Courses */}
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'my-courses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'hi' ? 'मेरे पाठ्यक्रम' : 'My Courses'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'my-courses' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              {enrolledCourses.length}
            </span>
          </button>

          {/* Tab 2: All Courses / Explore */}
          <button
            onClick={() => setActiveTab('all-courses')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'all-courses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{language === 'hi' ? 'सभी पाठ्यक्रम (खोजें व प्रवेश लें)' : 'All Courses (Explore & Enroll)'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'all-courses' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              {allPrimaryCourses.length}
            </span>
          </button>
        </div>

        {/* Total Courses Note */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-devanagari">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{language === 'hi' ? '100% निःशुल्क एवं सुरक्षित' : 'Free & Self-Paced Access'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: "MY COURSES" */}
      {/* ========================================================================= */}
      {activeTab === 'my-courses' && (
        <div className="space-y-6">
          {/* Sub Header & Search Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'hi' ? 'अपने नामांकित पाठ्यक्रम खोजें...' : 'Search your enrolled courses...'}
                value={myCourseSearch}
                onChange={e => setMyCourseSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: language === 'hi' ? 'सभी' : 'All' },
                { id: 'in_progress', label: language === 'hi' ? 'प्रगति पर' : 'In Progress' },
                { id: 'completed', label: language === 'hi' ? 'पूर्ण' : 'Completed' },
                { id: 'not_started', label: language === 'hi' ? 'शुरू नहीं हुआ' : 'Not Started' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === f.id
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enrolled Courses Grid */}
          {filteredMyCourses.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900 text-indigo-500 flex items-center justify-center mx-auto text-2xl">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {enrolledCourses.length === 0
                    ? (language === 'hi' ? 'आपने अभी तक किसी पाठ्यक्रम में नामांकन नहीं लिया है' : 'You have not enrolled in any courses yet')
                    : (language === 'hi' ? 'कोई पाठ्यक्रम मेल नहीं खाया' : 'No courses match your filter criteria')}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-devanagari leading-relaxed">
                  {enrolledCourses.length === 0
                    ? (language === 'hi' 
                        ? 'भौतिकी सिमुलेशन, कोडिंग सैंडबॉक्स, गणित और विज्ञान के पाठ्यक्रमों को देखने के लिए "सभी पाठ्यक्रम" टैब पर जाएं और अपनी पसंद का विषय चुनें।' 
                        : 'Explore our multi-branch curriculum across Physics, Coding, Math, and Humanities. Enroll in any course free with a single click!')
                    : (language === 'hi' ? 'कृपया अपना खोज शब्द या स्थिति फ़िल्टर बदलें।' : 'Try resetting your search query or status filter.')}
                </p>
              </div>

              {enrolledCourses.length === 0 ? (
                <button
                  onClick={() => setActiveTab('all-courses')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mx-auto transition-all"
                >
                  <Compass className="w-4 h-4" />
                  <span>{language === 'hi' ? 'सभी पाठ्यक्रम देखें और प्रवेश लें' : 'Explore All Courses & Enroll'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMyCourseSearch('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs mx-auto"
                >
                  {language === 'hi' ? 'फ़िल्टर हटाएं' : 'Clear Filters'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMyCourses.map(item => {
                const { course, totalLessons, completedLessons, percent, status, firstLeaf } = item;
                const title = course.translations[language]?.title || course.translations.en?.title || course.id;
                const desc = course.translations[language]?.description || course.translations.en?.description || '';
                const isExpanded = expandedSyllabusId === course.id;
                const childNodes = getChildNodes(course.id);

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/60 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {course.badge || course.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : status === 'in_progress'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {status === 'completed'
                              ? (language === 'hi' ? 'पूर्ण ✓' : 'Completed ✓')
                              : status === 'in_progress'
                              ? (language === 'hi' ? 'प्रगति पर' : 'In Progress')
                              : (language === 'hi' ? 'शुरू नहीं हुआ' : 'Not Started')}
                          </span>
                        </div>

                        {/* Unenroll button */}
                        <button
                          onClick={() => setUnenrollTarget({ id: course.id, title })}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title={language === 'hi' ? 'नामांकन हटाएं' : 'Unenroll from course'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Course Title */}
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {title}
                      </h3>

                      {/* Course Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 font-devanagari leading-relaxed">
                        {desc}
                      </p>

                      {/* Progress Bar & Counter */}
                      <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {language === 'hi' ? 'प्रगति:' : 'Track Progress:'}
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {percent}% ({completedLessons}/{totalLessons} {language === 'hi' ? 'पाठ' : 'modules'})
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Syllabus Accordion Preview */}
                      {childNodes.length > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setExpandedSyllabusId(isExpanded ? null : course.id)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                          >
                            <span>{isExpanded ? (language === 'hi' ? 'पाठ्यक्रम छिपाएं' : 'Hide Modules') : (language === 'hi' ? 'पाठ्यक्रम देखें' : 'View Modules / Syllabus')}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs animate-fadeIn">
                              {childNodes.map(sub => {
                                const subTitle = sub.translations[language]?.title || sub.translations.en?.title || sub.id;
                                const subDone = isCompleted(sub.id);
                                return (
                                  <div
                                    key={sub.id}
                                    onClick={() => onOpenClassroom(sub)}
                                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      {subDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                      )}
                                      <span className="truncate text-slate-700 dark:text-slate-300 text-[11px]">
                                        {subTitle}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                      {language === 'hi' ? 'खोलें →' : 'Launch →'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.estimatedMinutes || 120} min</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const target = firstLeaf || course;
                            onOpenClassroom(target);
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-102 active:scale-98"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>
                            {percent === 0
                              ? (language === 'hi' ? 'सीखना शुरू करें' : 'Start Learning')
                              : percent === 100
                              ? (language === 'hi' ? 'पुनरावृत्ति करें' : 'Review Track')
                              : (language === 'hi' ? 'अध्ययन जारी रखें' : 'Continue Learning')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: "ALL COURSES" (EXPLORE & ENROLL) */}
      {/* ========================================================================= */}
      {activeTab === 'all-courses' && (
        <div className="space-y-6">
          {/* Header Search & Category Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'hi' ? 'पाठ्यक्रम, भौतिकी, कोडिंग, गणित खोजें...' : 'Search any course by title, branch, or tag...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Branch Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: language === 'hi' ? 'सभी शाखाएं' : 'All Branches' },
                { id: 'science', label: language === 'hi' ? '🔬 प्राकृतिक विज्ञान (PCMB)' : '🔬 Natural Sciences' },
                { id: 'cs', label: language === 'hi' ? '💻 संगणक विज्ञान (CS & AI)' : '💻 Computer Science' },
                { id: 'math', label: language === 'hi' ? '📐 गणित (Mathematics)' : '📐 Mathematics' },
                { id: 'humanities', label: language === 'hi' ? '🎨 मानविकी व दर्शन' : '🎨 Humanities' },
                { id: 'economics', label: language === 'hi' ? '📈 अर्थशास्त्र एवं वित्त' : '📈 Economics' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* All Courses Grid */}
          {filteredAllCourses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <Compass className="w-10 h-10 mx-auto text-slate-400" />
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
                {language === 'hi' ? 'कोई पाठ्यक्रम नहीं मिला' : 'No matching courses found'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-devanagari">
                {language === 'hi' ? 'कृपया अपनी खोज या शाखा फ़िल्टर बदलें।' : 'Try adjusting your search query or category filters.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs mx-auto"
              >
                {language === 'hi' ? 'फ़िल्टर हटाएं' : 'Reset All Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAllCourses.map(course => {
                const title = course.translations[language]?.title || course.translations.en?.title || course.id;
                const desc = course.translations[language]?.description || course.translations.en?.description || '';
                const enrolled = isEnrolled(course.id) || (currentUser?.enrolledCourseIds || []).includes(course.id);
                const progressData = getCourseProgressData(course.id);

                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/80 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {course.badge || course.type.replace('_', ' ')}
                        </span>

                        {enrolled ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{language === 'hi' ? 'नामांकित' : 'Enrolled'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                            {language === 'hi' ? 'निःशुल्क' : 'Free Enrollment'}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {title}
                      </h3>

                      {/* Course Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 font-devanagari leading-relaxed">
                        {desc}
                      </p>

                      {/* Features / Tags */}
                      <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                        {course.codingProblem && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                            <Code2 className="w-3 h-3" />
                            <span>Code IDE</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {progressData.totalLessons} {language === 'hi' ? 'मॉड्यूल' : 'modules'}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.estimatedMinutes || 120} min</span>
                      </div>

                      <div>
                        {enrolled ? (
                          <button
                            onClick={() => {
                              const target = progressData.firstLeaf || course;
                              onOpenClassroom(target);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-102 active:scale-98"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'सीखना जारी रखें' : 'Continue Course'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'प्रवेश लें (Enroll)' : 'Enroll Now'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. UNENROLL CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {unenrollTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'hi' ? 'नामांकन रद्द करें?' : 'Unenroll from Course?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-devanagari">
                {language === 'hi'
                  ? `क्या आप वास्तव में "${unenrollTarget.title}" से अपना नामांकन हटाना चाहते हैं? आप बाद में किसी भी समय पुनः प्रवेश ले सकते हैं।`
                  : `Are you sure you want to unenroll from "${unenrollTarget.title}"? You can re-enroll at any time.`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnenrollTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmUnenroll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-colors"
              >
                {language === 'hi' ? 'हाँ, हटाएं' : 'Confirm Unenroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
