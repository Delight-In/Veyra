import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ContentProvider, useContent } from './context/ContentContext';
import { StudyProvider } from './context/StudyContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/pages/LandingPage';
import { SimulationsPage } from './components/pages/SimulationsPage';
import { ClassroomPage } from './components/pages/ClassroomPage';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { AdminPage } from './components/pages/AdminPage';
import { AuthPage } from './components/pages/AuthPage';
import { ContentPage } from './components/pages/ContentPage';
import { CreateBlogPage } from './components/pages/CreateBlogPage';
import { StudentDashboard } from './components/pages/StudentDashboard';
import { BlogsPage } from './components/pages/BlogsPage';
import { BlogProvider } from './context/BlogContext';
import { ContentNode } from './types';

const getInitialPage = (): string => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (path === 'dashboard' || path === 'student-dashboard') return 'dashboard';
    if (path === 'about') return 'about';
    if (path === 'simulations' || path === 'simulation') return 'simulations';
    if (path === 'courses') return 'blogs';
    if (path === 'admin/createblog' || path === 'admin/create-blog' || path === 'createblog' || path === 'create-blog') return 'admin-createblog';
    if (path === 'blogs' || path === 'blog') return 'blogs';
    if (path === 'login') return 'login';
    if (path === 'signup' || path === 'register') return 'signup';
    if (path === 'benefits' || path === 'benifits') return 'simulations';
    if (path === 'classroom') return 'classroom';
    if (path === 'content' || path.startsWith('content')) return 'content';
    if (path === 'contact') return 'contact';
    if (path === 'admin' || path === 'branch-admin') return 'admin';
  }
  return 'landing';
};

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);
  const [classroomNode, setClassroomNode] = useState<ContentNode | null>(null);
  const { getNodeById } = useContent();
  const { currentUser } = useAuth();

  const handleLoginSuccess = (user?: any) => {
    const activeUser = user || currentUser;
    if (activeUser?.role === 'super_admin' || activeUser?.role === 'branch_admin') {
      handleNavigate('admin');
    } else if (activeUser?.role === 'content_creator' || activeUser?.role === 'content_admin' || activeUser?.role === 'reviewer') {
      handleNavigate('content');
    } else if (activeUser?.role === 'parent') {
      handleNavigate('parent-dashboard');
    } else {
      handleNavigate('dashboard');
    }
  };

  // Scoped Security Barrier: Strictly enforce layer separation
  React.useEffect(() => {
    // If not logged in, protected operational dashboards require authentication
    if (!currentUser) {
      if (['admin', 'content', 'classroom'].includes(currentPage)) {
        handleNavigate('login');
      }
      return;
    }

    const role = currentUser.role;

    // Student / Learner (Zero access to admin, content studio, or classroom authoring)
    if (role === 'learner') {
      if (['admin', 'content', 'classroom', 'login', 'signup'].includes(currentPage)) {
        handleNavigate('dashboard');
      }
    }
    // Parent / Guardian
    else if (role === 'parent') {
      if (['admin', 'content', 'classroom', 'dashboard', 'login', 'signup'].includes(currentPage)) {
        handleNavigate('parent-dashboard');
      }
    }
    // Branch Admin (Dedicated Portal at /admin)
    else if (role === 'branch_admin') {
      if (['dashboard', 'login', 'signup'].includes(currentPage)) {
        handleNavigate('admin');
      }
    }
    // Content Creator / Content Admin (Dedicated Workspace at /content)
    else if (role === 'content_creator' || role === 'content_admin' || role === 'reviewer') {
      if (['dashboard', 'admin', 'login', 'signup'].includes(currentPage)) {
        handleNavigate('content');
      }
    }
    // Super Admin
    else if (role === 'super_admin') {
      if (['dashboard', 'login', 'signup'].includes(currentPage)) {
        handleNavigate('admin');
      }
    }
  }, [currentUser, currentPage]);

  React.useEffect(() => {
    if (currentPage === 'classroom') {
      const urlParams = new URLSearchParams(window.location.search);
      const nodeId = urlParams.get('node') || urlParams.get('id');
      if (nodeId) {
        const found = getNodeById(nodeId);
        if (found) {
          setClassroomNode(found);
        }
      }
    }
  }, [currentPage, getNodeById]);

  const handleOpenClassroom = (node?: ContentNode) => {
    const target = node || (getNodeById('mech-101') || null);
    setClassroomNode(target);
    setCurrentPage('classroom');
    const query = target ? `?node=${encodeURIComponent(target.id)}` : '';
    window.history.pushState({ page: 'classroom' }, '', `/classroom${query}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: string) => {
    let normalizedPage = (page === 'benifits' || page === 'benefits' || page === 'simulation') 
      ? 'simulations' 
      : (page === 'register') 
      ? 'signup' 
      : (page === 'student-dashboard')
      ? 'dashboard'
      : (page === 'branch-admin')
      ? 'admin'
      : (page === 'courses')
      ? 'blogs'
      : (page === 'admin/createblog' || page === 'admin/create-blog' || page === 'createblog' || page === 'create-blog' || page === 'admin-createblog')
      ? 'admin-createblog'
      : (page === 'blog')
      ? 'blogs'
      : page;

    // Security Guards for navigation:
    if (!currentUser) {
      if (['admin', 'content', 'classroom'].includes(normalizedPage)) {
        normalizedPage = 'login';
      }
    } else {
      const role = currentUser.role;
      if (role === 'learner') {
        if (['admin', 'content', 'classroom'].includes(normalizedPage)) {
          normalizedPage = 'dashboard';
        }
      } else if (role === 'parent') {
        if (['admin', 'content', 'classroom', 'dashboard'].includes(normalizedPage)) {
          normalizedPage = 'parent-dashboard';
        }
      } else if (role === 'super_admin') {
        if (['dashboard'].includes(normalizedPage)) {
          normalizedPage = 'admin';
        }
      } else if (role === 'branch_admin') {
        if (['dashboard'].includes(normalizedPage)) {
          normalizedPage = 'admin';
        }
      } else {
        // Content Admin / Content Creator
        if (['dashboard', 'admin'].includes(normalizedPage)) {
          normalizedPage = 'content';
        }
      }
    }

    setCurrentPage(normalizedPage);
    const targetPath = normalizedPage === 'landing' 
      ? '/' 
      : normalizedPage === 'admin-createblog' 
      ? '/admin/create-blog' 
      : `/${normalizedPage}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page: normalizedPage }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Sticky Header - Hidden in distraction-free story writing mode */}
      {currentPage !== 'admin-createblog' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      )}

      {/* Main Page Body */}
      {currentPage === 'admin-createblog' ? (
        <div className="flex-1 w-full">
          <CreateBlogPage
            onNavigate={handleNavigate}
          />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
          {currentPage === 'dashboard' && (
            <StudentDashboard
              onOpenClassroom={handleOpenClassroom}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'landing' && (
            <LandingPage
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'blogs' && (
            <BlogsPage
              onNavigate={handleNavigate}
              onOpenEditor={(blog) => {
                if (blog?.id) {
                  window.history.pushState(null, '', `/admin/create-blog?id=${encodeURIComponent(blog.id)}`);
                }
                handleNavigate('admin/create-blog');
              }}
            />
          )}

          {(currentPage === 'simulations' || currentPage === 'benefits') && (
            <SimulationsPage
              onOpenClassroom={handleOpenClassroom}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'classroom' && (
            <ClassroomPage
              activeNode={classroomNode}
              onNavigateCourses={() => handleNavigate('blogs')}
              onNavigateContentStudio={() => handleNavigate('content')}
            />
          )}

          {currentPage === 'content' && (
            <ContentPage
              onNavigate={handleNavigate}
              onOpenClassroom={handleOpenClassroom}
            />
          )}

          {currentPage === 'about' && (
            <AboutPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'login' && (
            <AuthPage
              initialMode="login"
              onNavigate={handleNavigate}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentPage === 'signup' && (
            <AuthPage
              initialMode="signup"
              onNavigate={handleNavigate}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentPage === 'contact' && (
            <ContactPage />
          )}

          {currentPage === 'admin' && (
            <AdminPage
              onNavigate={handleNavigate}
              onOpenClassroom={handleOpenClassroom}
            />
          )}
        </main>
      )}

      {/* Global Footer - Hidden in distraction-free story writing mode */}
      {currentPage !== 'admin-createblog' && (
        <Footer onNavigate={handleNavigate} currentPage={currentPage} />
      )}

      {/* Global Authentication Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ContentProvider>
            <StudyProvider>
              <BlogProvider>
                <MainApp />
              </BlogProvider>
            </StudyProvider>
          </ContentProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
