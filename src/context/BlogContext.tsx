import React, { createContext, useContext, useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { initialBlogPosts } from '../data/initialBlogs';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface BlogContextType {
  blogs: BlogPost[];
  publishedBlogs: BlogPost[];
  getBlogById: (id: string) => BlogPost | undefined;
  saveBlog: (data: Partial<BlogPost> & { title: string; content: string }) => BlogPost;
  publishBlog: (id: string) => void;
  unpublishBlog: (id: string) => void;
  deleteBlog: (id: string) => void;
  clapBlog: (id: string) => number;
  incrementViews: (id: string) => void;
  resetBlogsToDefault: () => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const STORAGE_KEY = 'veyra_blogs_v1';

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not parse saved blogs, falling back to initial data', e);
      }
    }
    return initialBlogPosts;
  });

  // Sync with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
      } catch (e) {
        console.error('Failed to save blogs to localStorage', e);
      }
    }
  }, [blogs]);

  const publishedBlogs = blogs.filter(b => b.status === 'published');

  const getBlogById = (id: string): BlogPost | undefined => {
    return blogs.find(b => b.id === id);
  };

  const calculateReadingTime = (content: string): number => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const saveBlog = (data: Partial<BlogPost> & { title: string; content: string }): BlogPost => {
    const readingTime = calculateReadingTime(data.content || '');
    
    // Existing post
    if (data.id && blogs.some(b => b.id === data.id)) {
      const existing = blogs.find(b => b.id === data.id)!;
      const updated: BlogPost = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
        readingTimeMinutes: readingTime,
        tags: data.tags || existing.tags || ['EdTech', 'Pedagogy'],
      };

      setBlogs(prev => prev.map(b => b.id === updated.id ? updated : b));
      // Call backend API /create-blog
      api.blogs.create(updated).catch(err => {
        console.info('Backend blog API notice (persisted in local state):', err?.message);
      });
      return updated;
    }

    // New post
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'story';
    
    const newId = `blog-${slug}-${Date.now().toString(36)}`;

    const newPost: BlogPost = {
      id: newId,
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || '',
      content: data.content,
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      coverImageCaption: data.coverImageCaption || '',
      authorId: currentUser?.id || 'user_super_admin',
      authorName: currentUser?.name || 'Priyanka',
      authorRole: currentUser?.role === 'super_admin' ? 'Founder & Chief Academic Officer' : 'Platform Administrator',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      authorBio: 'Physics Honours & IT Specialist. Founder at Veyra, pioneering active cognitive simulation engines.',
      publishedAt: data.status === 'published' ? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readingTimeMinutes: readingTime,
      status: data.status || 'draft',
      tags: data.tags && data.tags.length > 0 ? data.tags : ['Cognitive Science', 'EdTech'],
      claps: 0,
      views: 0,
      featured: data.featured || false,
    };

    setBlogs(prev => [newPost, ...prev]);
    // Call backend API /create-blog
    api.blogs.create(newPost).catch(err => {
      console.info('Backend blog API notice (persisted in local state):', err?.message);
    });
    return newPost;
  };

  const publishBlog = (id: string) => {
    setBlogs(prev => {
      const updated = prev.map(b => {
        if (b.id === id) {
          const publishedPost: BlogPost = {
            ...b,
            status: 'published' as const,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          // Call backend API /create-blog
          api.blogs.create(publishedPost).catch(err => {
            console.info('Backend blog publish notice:', err?.message);
          });
          return publishedPost;
        }
        return b;
      });
      return updated;
    });
  };

  const unpublishBlog = (id: string) => {
    setBlogs(prev => prev.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status: 'draft',
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    }));
  };

  const deleteBlog = (id: string) => {
    setBlogs(prev => prev.filter(b => b.id !== id));
  };

  const clapBlog = (id: string): number => {
    let nextClapCount = 0;
    setBlogs(prev => prev.map(b => {
      if (b.id === id) {
        nextClapCount = (b.claps || 0) + 1;
        return { ...b, claps: nextClapCount };
      }
      return b;
    }));
    return nextClapCount;
  };

  const incrementViews = (id: string) => {
    setBlogs(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, views: (b.views || 0) + 1 };
      }
      return b;
    }));
  };

  const resetBlogsToDefault = () => {
    setBlogs(initialBlogPosts);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBlogPosts));
    }
  };

  return (
    <BlogContext.Provider value={{
      blogs,
      publishedBlogs,
      getBlogById,
      saveBlog,
      publishBlog,
      unpublishBlog,
      deleteBlog,
      clapBlog,
      incrementViews,
      resetBlogsToDefault
    }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlogs = (): BlogContextType => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlogs must be used within a BlogProvider');
  }
  return context;
};
