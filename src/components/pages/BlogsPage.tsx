import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BlogPost } from '../../types';
import { useBlogs } from '../../context/BlogContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { speakWithIndianAccent, getActiveIndianVoiceLabel } from '../../utils/speechVoice';
import { getBlogSpokenParagraphs, SpeechParagraph } from '../../utils/blogSpeech';
import { BlogAudioPlayer } from '../blogs/BlogAudioPlayer';
import { MediumBlogEditor } from '../admin/MediumBlogEditor';
import { 
  BookOpen, Sparkles, Clock, Share2, Volume2, VolumeX, 
  Search, ArrowLeft, ArrowRight, Check, Plus, Edit3, 
  LayoutGrid, List, ChevronRight, CheckCircle2, 
  Eye, X, Headphones, ArrowUpRight, SlidersHorizontal, Globe, Play, Pause
} from 'lucide-react';

interface BlogsPageProps {
  initialBlogId?: string | null;
  onNavigate: (page: string) => void;
  onOpenEditor?: (blog?: BlogPost) => void;
}

export const BlogsPage: React.FC<BlogsPageProps> = ({
  initialBlogId,
  onNavigate,
  onOpenEditor
}) => {
  const { publishedBlogs, getBlogById, clapBlog, incrementViews } = useBlogs();
  const { currentUser, openAuthModal } = useAuth();
  const { language } = useLanguage();

  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(initialBlogId || null);
  const [activeTag, setActiveTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'quick'>('latest');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [clapAnim, setClapAnim] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // High-Accuracy Dual-Language Audio Narration State
  const [activeAudioBlog, setActiveAudioBlog] = useState<BlogPost | null>(null);
  const [audioLanguage, setAudioLanguage] = useState<'en' | 'hi'>(language === 'hi' ? 'hi' : 'en');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [preferredVoiceName, setPreferredVoiceName] = useState<string | undefined>(undefined);
  const [paragraphs, setParagraphs] = useState<SpeechParagraph[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Dedicated in-page Medium Blog Editor state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  // Strict Admin Privilege Verification: Only Super Admin and Branch Admin can author or edit blogs
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'branch_admin';

  const handleOpenWriteStory = (blogToEdit?: BlogPost) => {
    if (!isAdmin) {
      openAuthModal('login', language === 'hi' 
        ? 'केवल व्यवस्थापक (Admin) ही ब्लॉग लिख या संपादित कर सकते हैं। कृपया व्यवस्थापक खाते से लॉगिन करें।' 
        : 'Only administrators can author or edit stories. Please sign in with an administrator account.');
      return;
    }
    if (onOpenEditor) {
      onOpenEditor(blogToEdit);
    } else if (onNavigate) {
      if (blogToEdit?.id) {
        window.history.pushState(null, '', `/admin/create-blog?id=${encodeURIComponent(blogToEdit.id)}`);
      }
      onNavigate('admin/create-blog');
    } else {
      setEditingBlog(blogToEdit || null);
      setIsEditorOpen(true);
    }
  };

  const activeBlog = selectedBlogId ? getBlogById(selectedBlogId) : null;

  // Sync with initialBlogId prop or URL query parameter (?id=...)
  useEffect(() => {
    if (initialBlogId) {
      setSelectedBlogId(initialBlogId);
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');
      if (urlId) {
        setSelectedBlogId(urlId);
      }
    }
  }, [initialBlogId]);

  // Record view & handle reading scroll progress
  useEffect(() => {
    if (selectedBlogId) {
      incrementViews(selectedBlogId);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const handleScroll = () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
          setScrollProgress(progress);
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setScrollProgress(0);
    }
  }, [selectedBlogId]);

  // Tag extraction with article counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { All: publishedBlogs.length };
    publishedBlogs.forEach(b => {
      b.tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [publishedBlogs]);

  const allTags = useMemo(() => ['All', ...Object.keys(tagCounts).filter(t => t !== 'All')], [tagCounts]);

  // Filtered and sorted blogs
  const filteredBlogs = useMemo(() => {
    let result = publishedBlogs.filter(b => {
      if (activeTag !== 'All' && !b.tags.includes(activeTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchSubtitle = b.subtitle?.toLowerCase().includes(q);
        const matchContent = b.content.toLowerCase().includes(q);
        const matchTag = b.tags.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSubtitle && !matchContent && !matchTag) return false;
      }
      return true;
    });

    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => b.claps - a.claps);
    } else if (sortBy === 'quick') {
      result = [...result].sort((a, b) => a.readingTimeMinutes - b.readingTimeMinutes);
    } else {
      result = [...result].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    return result;
  }, [publishedBlogs, activeTag, searchQuery, sortBy]);

  const featuredBlog = useMemo(() => {
    return publishedBlogs.find(b => b.featured) || publishedBlogs[0];
  }, [publishedBlogs]);

  const relatedBlogs = useMemo(() => {
    if (!activeBlog) return [];
    return publishedBlogs
      .filter(b => b.id !== activeBlog.id)
      .slice(0, 3);
  }, [activeBlog, publishedBlogs]);

  const handleClap = (id: string) => {
    clapBlog(id);
    setClapAnim(true);
    setTimeout(() => setClapAnim(false), 500);
  };

  const handleShare = (blog: BlogPost) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/blogs?id=${encodeURIComponent(blog.id)}`;
      navigator.clipboard.writeText(url);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    }
  };

  // Stop speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Synchronize preferred voice from localStorage when language changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`preferred_tts_voice_${audioLanguage}`);
      if (saved) {
        setPreferredVoiceName(saved);
      }
    }
  }, [audioLanguage]);

  // Primary playback execution of paragraph at index
  const playParagraphAtIndex = (
    index: number,
    list: SpeechParagraph[] = paragraphs,
    lang: 'en' | 'hi' = audioLanguage,
    speed: number = playbackSpeed,
    voiceName?: string
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (index >= list.length || index < 0) {
      setIsPlayingAudio(false);
      isPlayingRef.current = false;
      return;
    }

    setCurrentParagraphIndex(index);
    setIsPlayingAudio(true);
    isPlayingRef.current = true;

    const item = list[index];
    utteranceRef.current = speakWithIndianAccent(item.spokenText, {
      lang: lang,
      rate: speed,
      preferredVoiceName: voiceName || preferredVoiceName,
      onEnd: () => {
        if (isPlayingRef.current) {
          if (index + 1 < list.length) {
            playParagraphAtIndex(index + 1, list, lang, speed, voiceName || preferredVoiceName);
          } else {
            setIsPlayingAudio(false);
            isPlayingRef.current = false;
          }
        }
      },
      onError: () => {
        setIsPlayingAudio(false);
        isPlayingRef.current = false;
      }
    });
  };

  const handleStartAudio = (
    blog: BlogPost, 
    lang: 'en' | 'hi' = audioLanguage, 
    startIdx: number = 0,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();

    // If already playing this blog with same language, toggle play/pause
    if (activeAudioBlog?.id === blog.id && audioLanguage === lang) {
      handleTogglePlayAudio();
      return;
    }

    const newParagraphs = getBlogSpokenParagraphs(blog, lang);
    setActiveAudioBlog(blog);
    setAudioLanguage(lang);
    setParagraphs(newParagraphs);
    playParagraphAtIndex(startIdx, newParagraphs, lang, playbackSpeed, preferredVoiceName);
  };

  const handleTogglePlayAudio = () => {
    if (!activeAudioBlog || paragraphs.length === 0) {
      if (activeBlog) {
        handleStartAudio(activeBlog, audioLanguage, 0);
      }
      return;
    }

    if (isPlayingAudio) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      isPlayingRef.current = false;
    } else {
      playParagraphAtIndex(currentParagraphIndex, paragraphs, audioLanguage, playbackSpeed, preferredVoiceName);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    isPlayingRef.current = false;
    setActiveAudioBlog(null);
    setCurrentParagraphIndex(0);
  };

  const handleLanguageChange = (newLang: 'en' | 'hi') => {
    if (!activeAudioBlog) {
      setAudioLanguage(newLang);
      return;
    }

    const newParagraphs = getBlogSpokenParagraphs(activeAudioBlog, newLang);
    setAudioLanguage(newLang);
    setParagraphs(newParagraphs);

    const savedVoice = typeof localStorage !== 'undefined' 
      ? localStorage.getItem(`preferred_tts_voice_${newLang}`) || undefined
      : undefined;
    setPreferredVoiceName(savedVoice);

    const targetIdx = Math.min(currentParagraphIndex, newParagraphs.length - 1);

    if (isPlayingAudio) {
      playParagraphAtIndex(targetIdx, newParagraphs, newLang, playbackSpeed, savedVoice);
    } else {
      setCurrentParagraphIndex(targetIdx);
    }
  };

  const handleSelectParagraph = (index: number) => {
    playParagraphAtIndex(index, paragraphs, audioLanguage, playbackSpeed, preferredVoiceName);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (isPlayingAudio) {
      playParagraphAtIndex(currentParagraphIndex, paragraphs, audioLanguage, newSpeed, preferredVoiceName);
    }
  };

  const handleVoiceSelect = (voiceName: string) => {
    setPreferredVoiceName(voiceName);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`preferred_tts_voice_${audioLanguage}`, voiceName);
    }
    if (isPlayingAudio) {
      playParagraphAtIndex(currentParagraphIndex, paragraphs, audioLanguage, playbackSpeed, voiceName);
    }
  };

  const handleRestartAudio = () => {
    playParagraphAtIndex(0, paragraphs, audioLanguage, playbackSpeed, preferredVoiceName);
  };

  const renderEditorOverlay = () => {
    if (!isEditorOpen || !isAdmin) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-[#080C14]">
        <MediumBlogEditor
          initialBlog={editingBlog}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingBlog(null);
          }}
          onPublished={(saved) => {
            setIsEditorOpen(false);
            setEditingBlog(null);
            setSelectedBlogId(saved.id);
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', `/blogs?id=${encodeURIComponent(saved.id)}`);
            }
          }}
        />
      </div>
    );
  };

  // =========================================================================
  // VIEW A: FULL ARTICLE READER (EDITORIAL MAGAZINE AESTHETIC)
  // =========================================================================
  if (activeBlog) {
    return (
      <div className="relative min-h-screen pb-20 animate-in fade-in duration-300">
        {/* Sticky Reading Progress Bar */}
        <div 
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 z-50 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-indigo-500/5 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6 space-y-8">
          {/* Top Sticky Header Actions */}
          <div className="sticky top-16 z-30 py-3 -mx-4 px-4 sm:px-6 bg-white/80 dark:bg-[#090D16]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 rounded-2xl shadow-xs transition-colors">
            <button
              onClick={() => {
                setSelectedBlogId(null);
                handleStopAudio();
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/blogs');
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all hover:-translate-x-0.5"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-500" />
              <span>{language === 'hi' ? '← सभी आलेखों पर वापस जाएं' : '← All Stories'}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Dual-Language Narration Language Selector */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleStartAudio(activeBlog, 'hi')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeAudioBlog?.id === activeBlog.id && audioLanguage === 'hi'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Listen in Hindi"
                >
                  <span>🇮🇳</span>
                  <span className="hidden sm:inline">हिन्दी</span>
                </button>
                <button
                  onClick={() => handleStartAudio(activeBlog, 'en')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeAudioBlog?.id === activeBlog.id && audioLanguage === 'en'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Listen in English"
                >
                  <span>🇬🇧</span>
                  <span className="hidden sm:inline">English</span>
                </button>
              </div>

              {/* Play / Pause Toggle Button */}
              <button
                onClick={(e) => {
                  if (activeAudioBlog?.id === activeBlog.id) {
                    handleTogglePlayAudio();
                  } else {
                    handleStartAudio(activeBlog, audioLanguage, 0, e);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isPlayingAudio && activeAudioBlog?.id === activeBlog.id
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                }`}
                title="Toggle Narration"
              >
                {isPlayingAudio && activeAudioBlog?.id === activeBlog.id ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>
                  {isPlayingAudio && activeAudioBlog?.id === activeBlog.id
                    ? (language === 'hi' ? 'रोकें' : 'Pause')
                    : (audioLanguage === 'hi' ? '🇮🇳 सुनें' : '🎧 Listen')}
                </span>
              </button>

              {/* Claps Button */}
              <button
                onClick={() => handleClap(activeBlog.id)}
                className={`px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${
                  clapAnim ? 'scale-110 ring-2 ring-amber-400' : ''
                }`}
                title="Clap for this story"
              >
                <span>👏</span>
                <span className="font-mono font-bold">{activeBlog.claps}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => handleShare(activeBlog)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                title="Share Story Link"
              >
                <Share2 className="w-4 h-4" />
                {copiedNotice && (
                  <span className="absolute -bottom-8 right-0 px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap shadow-lg animate-in fade-in">
                    Link copied!
                  </span>
                )}
              </button>

              {/* Admin Edit Button */}
              {isAdmin && (
                <button
                  onClick={() => handleOpenWriteStory(activeBlog)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'संपादित करें (Admin)' : 'Edit Story (Admin)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Article Container (Medium Editorial Width) */}
          <article className="max-w-3xl mx-auto space-y-8 pt-2">
            {/* Header Metadata */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {activeBlog.tags.map(t => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    {t}
                  </span>
                ))}
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1 ml-auto">
                  <Clock className="w-3.5 h-3.5" />
                  {activeBlog.readingTimeMinutes} min read
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-[1.16] tracking-tight">
                {activeBlog.title}
              </h1>

              {activeBlog.subtitle && (
                <p className="text-lg sm:text-2xl text-slate-600 dark:text-slate-300 font-sans font-light leading-relaxed">
                  {activeBlog.subtitle}
                </p>
              )}

              {/* Author Row with Credentials */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-4 border-t border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={activeBlog.authorAvatar}
                      alt={activeBlog.authorName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {activeBlog.authorName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Super Admin • Founder
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-sans flex items-center gap-2 mt-0.5">
                      <span>{new Date(activeBlog.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Eye className="w-3 h-3 text-slate-400" />
                        {activeBlog.views || 1} views
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dual-Language Narration Engine Deck */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                        Narration Engine
                      </span>
                      {/* Language indicator pills */}
                      <div className="flex items-center p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[10px]">
                        <button
                          onClick={() => handleStartAudio(activeBlog, 'hi')}
                          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                            audioLanguage === 'hi'
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          🇮🇳 हिन्दी
                        </button>
                        <button
                          onClick={() => handleStartAudio(activeBlog, 'en')}
                          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                            audioLanguage === 'en'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          🇬🇧 En
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {getActiveIndianVoiceLabel(audioLanguage, preferredVoiceName)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      if (activeAudioBlog?.id === activeBlog.id) {
                        handleTogglePlayAudio();
                      } else {
                        handleStartAudio(activeBlog, audioLanguage, 0, e);
                      }
                    }}
                    className="ml-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    {isPlayingAudio && activeAudioBlog?.id === activeBlog.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>{language === 'hi' ? 'रोकें' : 'Pause'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{language === 'hi' ? 'सुनें' : 'Listen'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Hero Cover Image */}
            {activeBlog.coverImage && (
              <figure className="space-y-2">
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl max-h-[480px]">
                  <img
                    src={activeBlog.coverImage}
                    alt={activeBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {activeBlog.coverImageCaption && (
                  <figcaption className="text-center text-xs text-slate-400 font-sans italic">
                    {activeBlog.coverImageCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Article Story Markdown Rendering */}
            <div className="prose prose-lg dark:prose-invert max-w-none font-serif text-slate-800 dark:text-slate-200 leading-relaxed space-y-6">
              {activeBlog.content.split('\n\n').map((paragraph, idx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                // 1. Video Embed: [video:URL|caption:CAPTION]
                const videoTagMatch = trimmed.match(/^\[video:(.*?)(?:\|caption:(.*?))?\]$/);
                if (videoTagMatch) {
                  const videoUrl = videoTagMatch[1];
                  const caption = videoTagMatch[2];
                  const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                  if (ytMatch && ytMatch[1]) {
                    return (
                      <figure key={idx} className="my-8 space-y-2">
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}`}
                            title={caption || 'Video'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                        {caption && <figcaption className="text-center text-xs text-slate-400 font-sans italic">{caption}</figcaption>}
                      </figure>
                    );
                  }
                  return (
                    <figure key={idx} className="my-8 space-y-2">
                      <video controls className="w-full rounded-2xl shadow-2xl max-h-[520px] bg-black border border-slate-200 dark:border-slate-800">
                        <source src={videoUrl} />
                      </video>
                      {caption && <figcaption className="text-center text-xs text-slate-400 font-sans italic">{caption}</figcaption>}
                    </figure>
                  );
                }

                // 2. Image markdown: ![alt](url)
                const imgMatch = trimmed.match(/!\[([\s\S]*?)\]\(([\s\S]*?)\)/);
                if (imgMatch) {
                  const caption = imgMatch[1]?.trim();
                  const src = imgMatch[2]?.trim();
                  return (
                    <figure key={idx} className="my-8 space-y-2">
                      <img
                        src={src}
                        alt={caption || 'Story illustration'}
                        className="w-full max-h-[550px] object-cover rounded-3xl shadow-lg border border-slate-200/80 dark:border-slate-800"
                      />
                      {caption && (
                        <figcaption className="text-center text-xs text-slate-400 font-sans italic">
                          {caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }

                // 3. Headings
                if (trimmed.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-2xl sm:text-4xl font-black font-serif text-slate-900 dark:text-white pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                      {trimmed.replace(/^#\s+/, '')}
                    </h1>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                      {trimmed.replace(/^##\s+/, '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-lg sm:text-2xl font-bold font-serif text-slate-900 dark:text-white pt-4">
                      {trimmed.replace(/^###\s+/, '')}
                    </h3>
                  );
                }

                // 4. Blockquotes
                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className="my-6 pl-6 border-l-4 border-emerald-500 italic text-lg sm:text-xl text-slate-700 dark:text-slate-300 font-serif leading-relaxed bg-emerald-50/30 dark:bg-emerald-950/20 py-3 rounded-r-2xl">
                      {trimmed.replace(/^>\s+/, '')}
                    </blockquote>
                  );
                }

                // 5. Code blocks
                if (trimmed.startsWith('```')) {
                  const code = trimmed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '');
                  return (
                    <pre key={idx} className="my-6 p-5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800 shadow-xl leading-relaxed">
                      <code>{code}</code>
                    </pre>
                  );
                }

                // 6. Unordered lists
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const items = trimmed.split('\n').filter(Boolean);
                  return (
                    <ul key={idx} className="my-4 space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300 text-base sm:text-lg">
                      {items.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item.replace(/^[-*]\s+/, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // 7. Standard Paragraph with Interactive Audio Highlighting & Listen-from-here
                const activeSpokenSnippet = paragraphs[currentParagraphIndex]?.rawMarkdown;
                const isCurrentlySpoken = activeAudioBlog?.id === activeBlog.id && isPlayingAudio && Boolean(
                  activeSpokenSnippet && trimmed.includes(activeSpokenSnippet.slice(0, 35))
                );
                const matchingSpeechIdx = paragraphs.findIndex(p => p.rawMarkdown && trimmed.includes(p.rawMarkdown.slice(0, 35)));

                return (
                  <div 
                    key={idx} 
                    className={`group relative transition-all duration-300 ${
                      isCurrentlySpoken 
                        ? 'ring-2 ring-amber-400 bg-amber-500/10 dark:bg-amber-400/10 rounded-2xl p-4 shadow-sm border border-amber-300 dark:border-amber-700' 
                        : ''
                    }`}
                  >
                    <p className="text-base sm:text-xl text-slate-800 dark:text-slate-200 leading-[1.75] font-serif font-normal">
                      {trimmed}
                    </p>
                    {matchingSpeechIdx >= 0 && (
                      <button
                        onClick={() => handleStartAudio(activeBlog, audioLanguage, matchingSpeechIdx)}
                        className="opacity-0 group-hover:opacity-100 absolute -left-7 sm:-left-9 top-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all text-xs border border-amber-200 dark:border-amber-800 shadow-xs"
                        title={language === 'hi' ? 'यहाँ से सुनें' : 'Listen from here'}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Author Bio Footer Card */}
            <div className="rounded-3xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm">
              <img
                src={activeBlog.authorAvatar}
                alt={activeBlog.authorName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/40 shrink-0"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-slate-900 dark:text-white">
                    {activeBlog.authorName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Founder & Author
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {activeBlog.authorRole}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  {activeBlog.authorBio || 'Physics Honours & IT Specialist. Founder at Veyra, engineering active multi-disciplinary learning systems.'}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  onClick={() => handleClap(activeBlog.id)}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="text-base">👏</span>
                  <span className="font-mono">{activeBlog.claps}</span>
                </button>
              </div>
            </div>

            {/* Related Research Dispatches */}
            {relatedBlogs.length > 0 && (
              <div className="pt-8 space-y-6 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>More from Veyra Dispatch</span>
                  </h3>
                  <button
                    onClick={() => setSelectedBlogId(null)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {relatedBlogs.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBlogId(b.id)}
                      className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between space-y-3 shadow-xs hover:shadow-lg"
                    >
                      <div className="space-y-2">
                        {b.coverImage && (
                          <div className="h-32 rounded-xl overflow-hidden">
                            <img
                              src={b.coverImage}
                              alt={b.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {b.title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                        <span>{b.readingTimeMinutes} min read</span>
                        <span>👏 {b.claps}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        {/* Medium Blog Editor Overlay in Reader View */}
        {renderEditorOverlay()}

        {/* Floating Docked High-Accuracy Audio Narration Player */}
        {activeAudioBlog && (
          <BlogAudioPlayer
            blog={activeAudioBlog}
            selectedLanguage={audioLanguage}
            onLanguageChange={handleLanguageChange}
            isPlaying={isPlayingAudio}
            onTogglePlay={handleTogglePlayAudio}
            onStop={handleStopAudio}
            currentParagraphIndex={currentParagraphIndex}
            totalParagraphs={paragraphs.length}
            currentParagraph={paragraphs[currentParagraphIndex]}
            onSelectParagraph={handleSelectParagraph}
            playbackSpeed={playbackSpeed}
            onChangeSpeed={handleSpeedChange}
            preferredVoiceName={preferredVoiceName}
            onSelectVoice={handleVoiceSelect}
            onRestart={handleRestartAudio}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW B: PUBLICATION HOMEPAGE (MATCHING LANDING PAGE QUALITY)
  // =========================================================================
  return (
    <div className="relative min-h-screen space-y-12 sm:space-y-16 pb-20 animate-in fade-in duration-300">
      {/* Ambient background glows matching Landing Page */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. HERO SECTION */}
      <section className="relative max-w-5xl mx-auto text-center space-y-5 pt-4 sm:pt-6 px-4">
        {/* Top Publication Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>VEYRA DISPATCH • OFFICIAL ACADEMIC JOURNAL & ESSAYS</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleOpenWriteStory()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ब्लॉग लिखें (Admin)' : 'Write Story (Admin)'}</span>
            </button>
          )}
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-serif text-slate-900 dark:text-white tracking-tight leading-[1.12]">
          Research, Cognition &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 dark:from-emerald-400 dark:via-teal-300 dark:to-indigo-400 font-serif">
            Living Dispatches
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
          In-depth research on kinesthetic computing, living 60 FPS simulations, cognitive load theories, and stateful multi-disciplinary learning systems by Founder & Chief Academic Officer Priyanka.
        </p>

        {/* Telemetry Highlight Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-4xl mx-auto">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-base sm:text-lg font-black font-serif text-slate-900 dark:text-white">
              {publishedBlogs.length}+
            </div>
            <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Peer-Reviewed Articles
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-base sm:text-lg font-black font-serif text-emerald-600 dark:text-emerald-400">
              60 FPS
            </div>
            <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Kinesthetic Simulations
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-base sm:text-lg font-black font-serif text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <span>🇮🇳</span>
              <span>Audio</span>
            </div>
            <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Indian Accent Engine
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-1">
            <div className="text-base sm:text-lg font-black font-serif text-indigo-600 dark:text-indigo-400">
              100%
            </div>
            <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Open Educational Access
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED STORY SHOWPIECE CARD */}
      {featuredBlog && activeTag === 'All' && !searchQuery.trim() && (
        <section className="max-w-6xl mx-auto px-4">
          <div
            onClick={() => setSelectedBlogId(featuredBlog.id)}
            className="group cursor-pointer rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-xl hover:shadow-2xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative overflow-hidden"
          >
            {/* Ambient card accent glow */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Left Content Column */}
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Featured Lead Story</span>
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {featuredBlog.readingTimeMinutes} min read
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black font-serif text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-[1.2]">
                {featuredBlog.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-sans">
                {featuredBlog.subtitle || featuredBlog.content.slice(0, 180)}
              </p>

              {/* Author & Action Deck */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <img
                    src={featuredBlog.authorAvatar}
                    alt={featuredBlog.authorName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                  />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{featuredBlog.authorName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      {new Date(featuredBlog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleStartAudio(featuredBlog, 'hi', 0, e)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 transition-colors shadow-2xs"
                    title="Listen in Hindi"
                  >
                    <span>🇮🇳</span>
                    <span>हिन्दी</span>
                  </button>

                  <button
                    onClick={(e) => handleStartAudio(featuredBlog, 'en', 0, e)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                    title="Listen in English"
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>

                  <div className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center gap-1 ml-1">
                    <span>👏</span>
                    <span>{featuredBlog.claps}</span>
                  </div>

                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Read Story</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Right Media Column */}
            <div className="relative overflow-hidden rounded-2xl h-64 sm:h-80 border border-slate-200/80 dark:border-slate-800">
              <img
                src={featuredBlog.coverImage}
                alt={featuredBlog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
            </div>
          </div>
        </section>
      )}

      {/* 3. CONTROLS DECK: CATEGORIES & SEARCH & VIEW TOGGLE */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Topic Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {allTags.map(tag => {
              const count = tagCounts[tag] || 0;
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm scale-105'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tag}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive 
                      ? 'bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Search & View Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder={language === 'hi' ? 'आलेख या विषय खोजें...' : 'Search dispatches, topics...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Switcher */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Clapped</option>
              <option value="quick">Quickest Read</option>
            </select>

            {/* Grid / List Layout Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Digest List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STORIES CATALOG (MATCHING LANDING PAGE CARD GRID) */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Published Dispatches ({filteredBlogs.length})
            </h3>
          </div>

          {activeTag !== 'All' && (
            <button
              onClick={() => setActiveTag('All')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h4 className="font-serif font-black text-xl text-slate-900 dark:text-white">
              No dispatches match your query
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              We couldn't find any articles matching &quot;{searchQuery}&quot;. Try exploring other category tags or clear your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTag('All');
              }}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ================= GRID VIEW: 3-COLUMN CARDS ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                onClick={() => setSelectedBlogId(blog.id)}
                className="group cursor-pointer rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1"
              >
                <div className="space-y-3.5">
                  {/* Cover Image Thumbnail */}
                  {blog.coverImage && (
                    <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 relative">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                          {blog.readingTimeMinutes} min
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Author meta row */}
                  <div className="flex items-center gap-2 text-xs">
                    <img
                      src={blog.authorAvatar}
                      alt={blog.authorName}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                    />
                    <span className="font-bold text-[12px] text-slate-800 dark:text-slate-200">
                      {blog.authorName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[11px] text-slate-400 font-sans">
                      {new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                    {blog.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {blog.subtitle || blog.content.slice(0, 120)}
                  </p>
                </div>

                {/* Card Footer: Tags & Claps & Audio */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {blog.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                      <button
                        onClick={(e) => handleStartAudio(blog, 'hi', 0, e)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                          activeAudioBlog?.id === blog.id && audioLanguage === 'hi' && isPlayingAudio
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                        title="Listen in Hindi (हिन्दी)"
                      >
                        <span>🇮🇳</span>
                        <span>हिन्दी</span>
                      </button>
                      <button
                        onClick={(e) => handleStartAudio(blog, 'en', 0, e)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                          activeAudioBlog?.id === blog.id && audioLanguage === 'en' && isPlayingAudio
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                        title="Listen in English"
                      >
                        <span>🇬🇧</span>
                        <span>Eng</span>
                      </button>
                    </div>

                    <div className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center gap-1">
                      <span>👏</span>
                      <span>{blog.claps}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ================= LIST VIEW: EDITORIAL DIGEST ================= */
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
            {filteredBlogs.map(blog => (
              <div
                key={blog.id}
                onClick={() => setSelectedBlogId(blog.id)}
                className="py-5 sm:py-6 group cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 rounded-2xl px-4"
              >
                {/* Left Content Column */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <img
                      src={blog.authorAvatar}
                      alt={blog.authorName}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                    />
                    <span className="font-bold text-slate-900 dark:text-white">{blog.authorName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 font-sans">{new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <h3 className="text-lg sm:text-2xl font-black font-serif text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {blog.title}
                  </h3>

                  {blog.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {blog.subtitle}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {blog.tags.slice(0, 2).map(t => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>

                    <span className="text-slate-400 text-[11px]">•</span>
                    <span className="text-slate-400 text-[11px] font-mono">{blog.readingTimeMinutes} min read</span>

                    <span className="text-slate-400 text-[11px]">•</span>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                      <button
                        onClick={(e) => handleStartAudio(blog, 'hi', 0, e)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                          activeAudioBlog?.id === blog.id && audioLanguage === 'hi' && isPlayingAudio
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                        title="Listen in Hindi (हिन्दी)"
                      >
                        <span>🇮🇳</span>
                        <span>हिन्दी</span>
                      </button>
                      <button
                        onClick={(e) => handleStartAudio(blog, 'en', 0, e)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                          activeAudioBlog?.id === blog.id && audioLanguage === 'en' && isPlayingAudio
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                        title="Listen in English"
                      >
                        <span>🇬🇧</span>
                        <span>Eng</span>
                      </button>
                    </div>

                    <span className="text-slate-400 text-[11px]">•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-[11px]">
                      👏 {blog.claps}
                    </span>
                  </div>
                </div>

                {/* Right Cover Image Thumbnail */}
                {blog.coverImage && (
                  <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Full-Screen Medium Blog Editor Overlay in Publication Feed */}
      {renderEditorOverlay()}

      {/* Floating Docked High-Accuracy Audio Narration Player */}
      {activeAudioBlog && (
        <BlogAudioPlayer
          blog={activeAudioBlog}
          selectedLanguage={audioLanguage}
          onLanguageChange={handleLanguageChange}
          isPlaying={isPlayingAudio}
          onTogglePlay={handleTogglePlayAudio}
          onStop={handleStopAudio}
          currentParagraphIndex={currentParagraphIndex}
          totalParagraphs={paragraphs.length}
          currentParagraph={paragraphs[currentParagraphIndex]}
          onSelectParagraph={handleSelectParagraph}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={handleSpeedChange}
          preferredVoiceName={preferredVoiceName}
          onSelectVoice={handleVoiceSelect}
          onRestart={handleRestartAudio}
        />
      )}
    </div>
  );
};
