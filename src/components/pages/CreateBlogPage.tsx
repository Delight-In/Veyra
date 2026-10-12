import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBlogs } from '../../context/BlogContext';
import { useLanguage } from '../../context/LanguageContext';
import { MediumBlogEditor } from '../admin/MediumBlogEditor';
import { BlogPost } from '../../types';
import { ShieldCheck, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

interface CreateBlogPageProps {
  onNavigate: (page: string) => void;
  initialBlog?: BlogPost | null;
}

export const CreateBlogPage: React.FC<CreateBlogPageProps> = ({
  onNavigate,
  initialBlog
}) => {
  const { currentUser, login, openAuthModal } = useAuth();
  const { getBlogById } = useBlogs();
  const { language } = useLanguage();

  const [activeBlog, setActiveBlog] = useState<BlogPost | null>(initialBlog || null);

  useEffect(() => {
    if (initialBlog) {
      setActiveBlog(initialBlog);
      return;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');
      if (urlId) {
        const found = getBlogById(urlId);
        if (found) {
          setActiveBlog(found);
        }
      }
    }
  }, [initialBlog, getBlogById]);

  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'branch_admin';

  // Strict Authorization Gate: Deny access to non-admins and guests
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080C14] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-900 dark:text-white">
              {language === 'hi' ? 'व्यवस्थापक प्रमाणीकरण आवश्यक' : 'Admin Authorization Required'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-devanagari leading-relaxed">
              {language === 'hi'
                ? 'केवल प्लेटफॉर्म व्यवस्थापक (Admin) ही ब्लॉग और शोध आलेख लिख या संपादित कर सकते हैं।'
                : 'Only platform administrators can author, publish, or edit stories in the Medium editor.'}
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => openAuthModal('login', 'Please sign in with administrator credentials to access the Medium story editor.')}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'hi' ? 'व्यवस्थापक के रूप में लॉगिन करें' : 'Sign in as Administrator'}</span>
            </button>

            <button
              onClick={() => onNavigate('blogs')}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>{language === 'hi' ? 'ब्लॉग आलेखों पर वापस जाएं' : 'Return to Stories'}</span>
            </button>

            <button
              onClick={() => onNavigate('landing')}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'मुख्य पृष्ठ पर जाएं' : 'Back to Home'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#080C14] text-slate-900 dark:text-slate-100 flex flex-col">
      <MediumBlogEditor
        key={activeBlog?.id || 'new-story'}
        initialBlog={activeBlog}
        onClose={() => onNavigate(currentUser?.role === 'super_admin' ? 'admin' : 'blogs')}
        onPublished={(publishedBlog) => {
          // Once published, route directly to the blogs feed with the new post active
          onNavigate('blogs');
        }}
      />
    </div>
  );
};
