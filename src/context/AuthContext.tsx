import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ContentNode, AdminRemark, UserNotification, BranchCategory } from '../types';
import { initialUsers } from '../data/initialUsers';
import { api, getStoredToken, removeStoredToken } from '../services/api';

export type AccessCheckResult = {
  hasAccess: boolean;
  reason: 'granted' | 'needs_login' | 'needs_enrollment' | 'branch_restricted' | 'draft_restricted';
  message?: string;
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  allUsers: User[];
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authModalNotice: string | null;
  isBackendConnected: boolean;
  openAuthModal: (mode?: 'login' | 'register', notice?: string) => void;
  closeAuthModal: () => void;
  login: (email: string, password?: string) => Promise<{ 
    success: boolean; 
    message?: string; 
    requireVerification?: boolean; 
    email?: string; 
    testOtpCode?: string; 
    user?: User;
  }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    branchCategory?: BranchCategory;
  }) => Promise<{ 
    success: boolean; 
    message?: string; 
    requireVerification?: boolean; 
    email?: string; 
    testOtpCode?: string; 
    user?: User;
  }>;
  verifyEmail: (email: string, code: string) => Promise<{ 
    success: boolean; 
    message?: string; 
  }>;
  resendVerification: (email: string) => Promise<{ 
    success: boolean; 
    message?: string; 
    testOtpCode?: string; 
  }>;
  forgotPassword: (email: string) => Promise<{ 
    success: boolean; 
    message?: string; 
    testResetCode?: string; 
  }>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<{ 
    success: boolean; 
    message?: string; 
  }>;
  logout: () => void;
  canManageNode: (nodeId: string, nodePath: string) => boolean;
  canPublishDirectly: () => boolean;
  canAccessNode: (node: ContentNode) => AccessCheckResult;
  enrollInCourse: (courseId: string) => void;
  unenrollCourse: (courseId: string) => void;
  isEnrolled: (courseId: string) => boolean;
  grantCourseAccess: (userId: string, courseId: string) => void;
  revokeCourseAccess: (userId: string, courseId: string) => void;
  addAdminRemark: (userId: string, remark: string) => Promise<void>;
  deleteAdminRemark: (userId: string, remarkId: string) => Promise<void>;
  sendMessageToUser: (userId: string, title: string, message: string) => Promise<void>;
  broadcastMessageToAll: (title: string, message: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  updateUserRoleAndBranch: (userId: string, updates: Partial<User>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  createAdminUser: (adminData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    branchCategory?: BranchCategory;
    assignedBranchName?: string;
    assignedNodeId?: string;
  }) => Promise<{ success: boolean; message?: string; user?: User }>;
  createContentAdminByBranchAdmin: (data: {
    name: string;
    email: string;
    password: string;
    assignedNodeId?: string;
    assignedBranchName?: string;
  }) => Promise<{ success: boolean; message?: string; user?: User }>;
  evaluateContentAdmin: (contentAdminId: string, evaluation: {
    score?: number;
    rating?: number;
    remarks?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
  getUserByStudentOrUserId: (identifier: string) => User | undefined;
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  isContentAdmin: boolean;
  isContentCreator: boolean;
  isReviewer: boolean;
  isLearner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const deletedIdsRaw = localStorage.getItem('veyra_deleted_user_ids');
    const deletedIds: Set<string> = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);

    const saved = localStorage.getItem('veyra_users_v1') || localStorage.getItem('edunova_users_v3');
    if (!saved) {
      return initialUsers.filter(u => !deletedIds.has(u.id) && !deletedIds.has(u.email.toLowerCase()));
    }
    try {
      const parsed: User[] = JSON.parse(saved);
      // Filter out any user that was marked deleted
      const activeParsed = parsed.filter(u => !deletedIds.has(u.id) && !deletedIds.has(u.email.toLowerCase()));

      // Only ensure root Super Admin Priyanka exists if not deleted
      const priyanka = initialUsers.find(u => u.email.toLowerCase() === 'priyanka@veyra.com');
      const hasPriyanka = activeParsed.some(u => u.email.toLowerCase() === 'priyanka@veyra.com');
      if (priyanka && !hasPriyanka && !deletedIds.has('priyanka@veyra.com')) {
        return [priyanka, ...activeParsed];
      }
      return activeParsed;
    } catch {
      return initialUsers.filter(u => !deletedIds.has(u.id) && !deletedIds.has(u.email.toLowerCase()));
    }
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const savedUserJson = localStorage.getItem('veyra_current_user_v1') || localStorage.getItem('edunova_current_user_v3');
    if (savedUserJson) {
      try {
        return JSON.parse(savedUserJson);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalNotice, setAuthModalNotice] = useState<string | null>(null);

  // Sync session with backend MongoDB on mount
  useEffect(() => {
    async function initSession() {
      try {
        const health = await api.health.check();
        if (health.status === 'healthy') {
          setIsBackendConnected(true);
        }

        const token = getStoredToken();
        if (token) {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setCurrentUserState(res.user);
          }
        }

        // Fetch users from MongoDB if authorized or authenticated
        const usersRes = await api.users.getAll().catch(() => null);
        if (usersRes && usersRes.success && usersRes.users) {
          const deletedIdsRaw = localStorage.getItem('veyra_deleted_user_ids');
          const deletedIds: Set<string> = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
          const activeUsers = usersRes.users.filter(u => !deletedIds.has(u.id) && !deletedIds.has(u.email.toLowerCase()));
          setAllUsers(activeUsers);
          localStorage.setItem('veyra_users_v1', JSON.stringify(activeUsers));
        }
      } catch (err) {
        console.warn('Backend server offline or unauthenticated. Using local session.', err);
        setIsBackendConnected(false);
      }
    }

    initSession();
  }, []);

  // Persist user state locally
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('veyra_current_user_v1', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('veyra_current_user_v1');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('veyra_users_v1', JSON.stringify(allUsers));
  }, [allUsers]);

  const openAuthModal = (mode: 'login' | 'register' = 'login', notice?: string) => {
    setAuthModalMode(mode);
    setAuthModalNotice(notice || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalNotice(null);
  };

  /**
   * Sophisticated Login with MongoDB and Email Verification Gate
   */
  const login = async (email: string, password?: string): Promise<{ 
    success: boolean; 
    message?: string; 
    requireVerification?: boolean; 
    email?: string; 
    testOtpCode?: string; 
    user?: User;
  }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try real backend MongoDB login
    try {
      const res = await api.auth.login(cleanEmail, password || '');
      if (res.success && res.user) {
        setCurrentUserState(res.user);
        closeAuthModal();
        return { success: true, message: res.message, user: res.user };
      }
    } catch (err: any) {
      if (err.data && err.data.requireVerification) {
        return {
          success: false,
          requireVerification: true,
          email: err.data.email || cleanEmail,
          message: err.data.message || 'Please verify your email address.',
          testOtpCode: err.data.testOtpCode
        };
      }
      console.warn('Backend login unavailable or unverified, checking local credentials directory:', err.message);
    }

    // 2. Fallback to local memory / initialUsers directory
    const found = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, message: 'Invalid email or password.' };
    }

    if (password && found.password && found.password !== password) {
      return { success: false, message: 'Invalid email or password.' };
    }

    setCurrentUserState(found);
    closeAuthModal();
    return { success: true, message: 'Login successful!', user: found };
  };

  /**
   * Sophisticated Registration with MongoDB and Email OTP (plus Local Session Fallback)
   */
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    branchCategory?: BranchCategory;
  }): Promise<{ 
    success: boolean; 
    message?: string; 
    requireVerification?: boolean; 
    email?: string; 
    testOtpCode?: string; 
    user?: User;
  }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const role = data.role || 'learner';

    // 1. Try real backend MongoDB registration
    try {
      const res = await api.auth.register({
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password,
        role: role,
        branchCategory: data.branchCategory
      });

      return {
        success: true,
        requireVerification: true,
        email: res.email || cleanEmail,
        message: res.message,
        testOtpCode: res.testOtpCode
      };
    } catch (err: any) {
      console.warn('Backend registration failed, creating user in local session:', err.message);

      // Check duplicate email
      const exists = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        return { 
          success: false, 
          message: `An account with email "${data.email}" already exists. Please sign in instead.` 
        };
      }

      // Generate student ID if learner
      let studentId: string | undefined = undefined;
      if (role === 'learner') {
        studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const newUser: User = {
        id: `user_${role}_${Date.now()}`,
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password,
        role: role,
        studentId,
        preferredLanguage: 'en',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        enrolledCourseIds: ['node_science'],
        isEmailVerified: true,
        xp: 50,
        streakDays: 1,
        adminRemarks: [],
        notifications: [{
          id: `notif_${Date.now()}`,
          title: 'Welcome to EduNova! 🚀',
          message: 'Welcome to EduNova! Explore our interactive simulations, courses, and labs.',
          sender: 'EduNova System',
          senderRole: 'super_admin',
          timestamp: new Date().toISOString(),
          read: false
        }]
      };

      const updatedUsers = [newUser, ...allUsers];
      setAllUsers(updatedUsers);
      localStorage.setItem('veyra_users_v1', JSON.stringify(updatedUsers));

      // Auto sign in in local session
      setCurrentUserState(newUser);
      closeAuthModal();

      return {
        success: true,
        message: 'Account created and signed in successfully!',
        user: newUser
      };
    }
  };

  /**
   * Verify Email Code (OTP)
   */
  const verifyEmail = async (email: string, code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.auth.verifyEmail(email, code);
      if (res.success && res.user) {
        setCurrentUserState(res.user);
        closeAuthModal();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Verification failed.' };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Invalid or expired verification code.'
      };
    }
  };

  /**
   * Resend Email Verification Code
   */
  const resendVerification = async (email: string): Promise<{ success: boolean; message?: string; testOtpCode?: string }> => {
    try {
      const res = await api.auth.resendCode(email);
      return {
        success: true,
        message: res.message,
        testOtpCode: res.testOtpCode
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to resend code.'
      };
    }
  };

  /**
   * Forgot Password
   */
  const forgotPassword = async (email: string): Promise<{ success: boolean; message?: string; testResetCode?: string }> => {
    try {
      const res = await api.auth.forgotPassword(email);
      return {
        success: true,
        message: res.message,
        testResetCode: res.testResetCode
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to process password reset request.'
      };
    }
  };

  /**
   * Reset Password
   */
  const resetPassword = async (email: string, code: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.auth.resetPassword(email, code, newPass);
      return { success: true, message: res.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to reset password.'
      };
    }
  };

  const logout = () => {
    removeStoredToken();
    setCurrentUserState(null);
  };

  /**
   * Scoped RBAC Engine
   */
  const canManageNode = (nodeId: string, nodePath: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    if (currentUser.role === 'branch_admin' || currentUser.role === 'content_creator') {
      if (!currentUser.assignedNodeId) return false;
      const pathTokens = nodePath.split('.');
      return pathTokens.includes(currentUser.assignedNodeId) || nodeId === currentUser.assignedNodeId;
    }

    if (currentUser.role === 'reviewer') {
      return true;
    }

    return false;
  };

  const canPublishDirectly = (): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'super_admin' || currentUser.role === 'branch_admin';
  };

  /**
   * Course Access Evaluation Engine
   */
  const canAccessNode = (node: ContentNode): AccessCheckResult => {
    // 0. Preview nodes or nodes authored by current user are always accessible:
    if (node.id === 'preview_node' || node.path === 'preview_node' || (currentUser && node.createdBy === currentUser.id)) {
      return { hasAccess: true, reason: 'granted' };
    }

    // 1. All administrative and creator roles have unrestricted access to preview and evaluate:
    if (currentUser && currentUser.role !== 'learner') {
      return { hasAccess: true, reason: 'granted' };
    }

    // 2. If content is in draft or under review for non-administrative users:
    if (node.status !== 'published') {
      return {
        hasAccess: false,
        reason: 'draft_restricted',
        message: 'This topic is in draft/review mode and only accessible to assigned educators.'
      };
    }

    // 2. If user is unauthenticated:
    if (!currentUser) {
      return {
        hasAccess: false,
        reason: 'needs_login',
        message: 'Please sign in or create a verified account to enter this course and save progress.'
      };
    }

    // 3. Super Admin and all administrative/creator/reviewer roles have unrestricted access:
    if (currentUser.role !== 'learner') {
      return { hasAccess: true, reason: 'granted' };
    }

    // 4. Check enrollment for learners:
    const rootDisciplineId = node.path.split('.')[0];
    const isUserEnrolled = currentUser.enrolledCourseIds?.includes(rootDisciplineId) ||
                           currentUser.enrolledCourseIds?.includes(node.id);

    if (isUserEnrolled || node.accessLevel === 'public' || currentUser.role === 'reviewer' || currentUser.role === 'content_creator') {
      return { hasAccess: true, reason: 'granted' };
    }

    return {
      hasAccess: false,
      reason: 'needs_enrollment',
      message: 'You are not yet enrolled in this course track. Click below to enroll for free!'
    };
  };

  const isEnrolled = (courseId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'branch_admin') return true;
    return currentUser.enrolledCourseIds?.includes(courseId) || false;
  };

  const enrollInCourse = (courseId: string) => {
    if (!currentUser) {
      openAuthModal('login', 'Please log in to enroll in this course.');
      return;
    }

    if (!currentUser.enrolledCourseIds?.includes(courseId)) {
      const updatedUser: User = {
        ...currentUser,
        enrolledCourseIds: [...(currentUser.enrolledCourseIds || []), courseId]
      };
      setCurrentUserState(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      // Sync with MongoDB backend if available
      api.users.enroll(courseId).catch(err => {
        console.warn('Could not sync enrollment to backend:', err);
      });
    }
  };

  const unenrollCourse = (courseId: string) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      enrolledCourseIds: (currentUser.enrolledCourseIds || []).filter(id => id !== courseId)
    };
    setCurrentUserState(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // Sync with MongoDB backend if available
    api.users.unenroll(courseId).catch(err => {
      console.warn('Could not sync unenrollment to backend:', err);
    });
  };

  const grantCourseAccess = (userId: string, courseId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const current = u.enrolledCourseIds || [];
        if (!current.includes(courseId)) {
          const updated = { ...u, enrolledCourseIds: [...current, courseId] };
          if (currentUser?.id === userId) setCurrentUserState(updated);
          return updated;
        }
      }
      return u;
    }));
  };

  const revokeCourseAccess = (userId: string, courseId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = {
          ...u,
          enrolledCourseIds: (u.enrolledCourseIds || []).filter(id => id !== courseId)
        };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      }
      return u;
    }));
  };

  // ==========================================================
  // SUPER ADMIN CAPABILITIES: REMARK EVERY USER & MESSAGE
  // ==========================================================
  const addAdminRemark = async (userId: string, remark: string) => {
    if (!remark.trim()) return;

    // Optimistic local update
    const newRemark: AdminRemark = {
      id: `rem_${Date.now()}`,
      remark: remark.trim(),
      author: currentUser?.name || 'Super Administrator',
      timestamp: new Date().toISOString()
    };

    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const currentRemarks = u.adminRemarks || [];
        const updated = { ...u, adminRemarks: [newRemark, ...currentRemarks] };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      }
      return u;
    }));

    // Async sync with MongoDB
    await api.users.addRemark(userId, remark).catch(err => {
      console.warn('Could not sync remark to backend:', err);
    });
  };

  const deleteAdminRemark = async (userId: string, remarkId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, adminRemarks: (u.adminRemarks || []).filter(r => r.id !== remarkId) };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      }
      return u;
    }));

    await api.users.deleteRemark(userId, remarkId).catch(err => {
      console.warn('Could not sync remark deletion to backend:', err);
    });
  };

  const sendMessageToUser = async (userId: string, title: string, message: string) => {
    if (!title.trim() || !message.trim()) return;

    const notif: UserNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: currentUser?.name || 'Super Administrator',
      senderRole: currentUser?.role || 'super_admin',
      title: title.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const currentNotifs = u.notifications || [];
        const updated = { ...u, notifications: [notif, ...currentNotifs] };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      }
      return u;
    }));

    await api.users.sendMessage(userId, title, message).catch(err => {
      console.warn('Could not sync message to backend:', err);
    });
  };

  const broadcastMessageToAll = async (title: string, message: string) => {
    if (!title.trim() || !message.trim()) return;

    const notif: UserNotification = {
      id: `notif_bcast_${Date.now()}`,
      sender: currentUser?.name || 'Super Administrator',
      senderRole: currentUser?.role || 'super_admin',
      title: title.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setAllUsers(prev => prev.map(u => {
      const currentNotifs = u.notifications || [];
      const updated = { ...u, notifications: [notif, ...currentNotifs] };
      if (currentUser?.id === u.id) setCurrentUserState(updated);
      return updated;
    }));

    await api.users.broadcast(title, message).catch(err => {
      console.warn('Could not broadcast message to backend:', err);
    });
  };

  const markNotificationAsRead = (notificationId: string) => {
    if (!currentUser) return;
    const updatedNotifs = (currentUser.notifications || []).map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    const updatedUser = { ...currentUser, notifications: updatedNotifs };
    setCurrentUserState(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const updateUserRoleAndBranch = async (userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...updates };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      }
      return u;
    }));

    await api.users.updateRole(userId, {
      role: updates.role,
      branchCategory: updates.branchCategory,
      assignedNodeId: updates.assignedNodeId,
      assignedBranchName: updates.assignedBranchName
    }).catch(err => {
      console.warn('Could not sync role update to backend:', err);
    });
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...updates };
        if (currentUser?.id === userId) {
          setCurrentUserState(updated);
        }
        return updated;
      }
      return u;
    }));

    if (currentUser?.id === userId) {
      setCurrentUserState(prev => prev ? { ...prev, ...updates } : null);
    }

    if (updates.role || updates.branchCategory || updates.assignedBranchName) {
      await api.users.updateRole(userId, {
        role: updates.role,
        branchCategory: updates.branchCategory,
        assignedNodeId: updates.assignedNodeId,
        assignedBranchName: updates.assignedBranchName
      }).catch(err => {
        console.warn('Could not sync role update to backend:', err);
      });
    }

    return { success: true, message: 'User updated successfully.' };
  };

  const changeUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, password: newPassword };
        if (currentUser?.id === userId) {
          setCurrentUserState(updated);
        }
        return updated;
      }
      return u;
    }));

    if (currentUser?.id === userId) {
      setCurrentUserState(prev => prev ? { ...prev, password: newPassword } : null);
    }

    return { 
      success: true, 
      message: `Password successfully updated to: ${newPassword}` 
    };
  };

  const createAdminUser = async (adminData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    branchCategory?: BranchCategory;
    assignedBranchName?: string;
    assignedNodeId?: string;
  }): Promise<{ success: boolean; message?: string; user?: User }> => {
    const cleanEmail = adminData.email.trim().toLowerCase();
    const exists = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, message: `An account with email "${adminData.email}" already exists.` };
    }

    const newAdmin: User = {
      id: `user_admin_${Date.now()}`,
      name: adminData.name.trim(),
      email: cleanEmail,
      password: adminData.password,
      role: adminData.role,
      branchCategory: adminData.branchCategory || 'pcmb',
      assignedNodeId: adminData.assignedNodeId || (adminData.branchCategory === 'cs' ? 'node_cs' : 'node_science'),
      assignedBranchName: adminData.assignedBranchName || (adminData.branchCategory === 'cs' ? 'Computer Science & AI (संगणक विज्ञान)' : 'Natural Sciences & PCMB (प्राकृतिक विज्ञान)'),
      preferredLanguage: 'en',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      enrolledCourseIds: ['node_science', 'node_math', 'node_cs'],
      isEmailVerified: true,
      xp: 2200,
      streakDays: 1,
      adminRemarks: [
        {
          id: `rem_${Date.now()}`,
          remark: `Administrator created by Super Admin Priyanka on ${new Date().toLocaleDateString()}. Assigned to ${adminData.assignedBranchName || 'Branch'}.`,
          author: currentUser?.name || 'Priyanka (Super Admin)',
          timestamp: new Date().toISOString()
        }
      ],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          sender: currentUser?.name || 'Priyanka (Super Admin)',
          senderRole: 'super_admin',
          title: 'Administrator Credentials Provisioned',
          message: `Welcome to Veyra Administration. You have been granted ${adminData.role} authority over ${adminData.assignedBranchName || 'your assigned branch'}.`,
          timestamp: new Date().toISOString(),
          read: false
        }
      ]
    };

    try {
      const backendRes = await api.users.create({
        name: adminData.name.trim(),
        email: cleanEmail,
        password: adminData.password,
        role: adminData.role,
        branchCategory: adminData.branchCategory,
        assignedBranchName: adminData.assignedBranchName,
        assignedNodeId: adminData.assignedNodeId
      });
      if (backendRes.success && backendRes.user) {
        newAdmin.id = backendRes.user.id || newAdmin.id;
      }
    } catch (err: any) {
      console.warn('Backend user creation notice (saved locally):', err.message);
    }

    const updatedUsers = [newAdmin, ...allUsers.filter(u => u.email.toLowerCase() !== cleanEmail)];
    setAllUsers(updatedUsers);
    localStorage.setItem('veyra_users_v1', JSON.stringify(updatedUsers));

    return {
      success: true,
      message: `Administrator "${newAdmin.name}" created successfully!`,
      user: newAdmin
    };
  };

  // ==========================================================
  // BRANCH ADMIN CAPABILITIES: CREATE & EVALUATE CONTENT ADMINS
  // ==========================================================
  const createContentAdminByBranchAdmin = async (data: {
    name: string;
    email: string;
    password: string;
    assignedNodeId?: string;
    assignedBranchName?: string;
  }): Promise<{ success: boolean; message?: string; user?: User }> => {
    if (!currentUser) {
      return { success: false, message: 'Must be authenticated as Branch Admin.' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const exists = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, message: `An account with email "${data.email}" already exists.` };
    }

    const assignedNodeId = data.assignedNodeId || currentUser.assignedNodeId || 'node_science';
    const assignedBranchName = data.assignedBranchName || currentUser.assignedBranchName || 'Branch Curriculum Studio';

    const newContentAdmin: User = {
      id: `user_ca_${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password,
      role: 'content_creator',
      branchCategory: currentUser.branchCategory || 'pcmb',
      assignedNodeId,
      assignedBranchName,
      preferredLanguage: 'hi',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      enrolledCourseIds: [assignedNodeId, 'node_science', 'node_math', 'node_cs'],
      isEmailVerified: true,
      xp: 1500,
      streakDays: 1,
      createdBy: currentUser.id,
      performanceScore: 92,
      evaluationRating: 5,
      evaluationRemarks: `Created by Branch Admin ${currentUser.name}. Responsible for authoring lessons, ensuring visual display accuracy, and submitting modules for branch approval.`,
      lastEvaluatedAt: new Date().toISOString(),
      adminRemarks: [
        {
          id: `rem_${Date.now()}`,
          remark: `Content Administrator created by Branch Admin ${currentUser.name} on ${new Date().toLocaleDateString()}. Assigned to ${assignedBranchName}.`,
          author: currentUser.name,
          timestamp: new Date().toISOString()
        }
      ],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          sender: currentUser.name,
          senderRole: 'branch_admin',
          title: 'Content Administrator Access Provisioned',
          message: `Welcome! Branch Admin ${currentUser.name} has appointed you as Content Admin for ${assignedBranchName}. Create interactive modules, review previews for display perfection, and submit for branch approval to make them public.`,
          timestamp: new Date().toISOString(),
          read: false
        }
      ]
    };

    try {
      const backendRes = await api.users.create({
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password,
        role: 'content_creator',
        branchCategory: currentUser.branchCategory,
        assignedBranchName,
        assignedNodeId
      });
      if (backendRes.success && backendRes.user) {
        newContentAdmin.id = backendRes.user.id || newContentAdmin.id;
      }
    } catch (err: any) {
      console.warn('Backend content admin creation notice (saved locally):', err.message);
    }

    const updatedUsers = [newContentAdmin, ...allUsers.filter(u => u.email.toLowerCase() !== cleanEmail)];
    setAllUsers(updatedUsers);
    localStorage.setItem('veyra_users_v1', JSON.stringify(updatedUsers));

    return {
      success: true,
      message: `Content Admin "${newContentAdmin.name}" created successfully!`,
      user: newContentAdmin
    };
  };

  const evaluateContentAdmin = async (
    contentAdminId: string, 
    evaluation: { score?: number; rating?: number; remarks?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    const target = allUsers.find(u => u.id === contentAdminId);
    if (!target) {
      return { success: false, message: 'Content Admin user not found.' };
    }

    const evalNotif: UserNotification = {
      id: `notif_eval_${Date.now()}`,
      sender: currentUser?.name || 'Branch Administration',
      senderRole: 'branch_admin',
      title: 'Performance Evaluation & Progress Review 📊',
      message: `Your supervising Branch Admin ${currentUser?.name} reviewed your content quality. Score: ${evaluation.score ?? target.performanceScore ?? 90}/100, Rating: ${evaluation.rating ?? target.evaluationRating ?? 5}/5. Feedback: "${evaluation.remarks || 'Keep up the good pedagogical quality.'}"`,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedUsers = allUsers.map(u => {
      if (u.id === contentAdminId) {
        return {
          ...u,
          performanceScore: evaluation.score !== undefined ? evaluation.score : u.performanceScore,
          evaluationRating: evaluation.rating !== undefined ? evaluation.rating : u.evaluationRating,
          evaluationRemarks: evaluation.remarks !== undefined ? evaluation.remarks : u.evaluationRemarks,
          lastEvaluatedAt: new Date().toISOString(),
          notifications: [evalNotif, ...(u.notifications || [])]
        };
      }
      return u;
    });

    setAllUsers(updatedUsers);
    localStorage.setItem('veyra_users_v1', JSON.stringify(updatedUsers));

    // Async sync with MongoDB if available
    try {
      const token = getStoredToken();
      if (token) {
        await fetch(`/api/users/${encodeURIComponent(contentAdminId)}/evaluate`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            performanceScore: evaluation.score,
            evaluationRating: evaluation.rating,
            evaluationRemarks: evaluation.remarks
          })
        });
      }
    } catch (err: any) {
      console.warn('Backend evaluation sync notice:', err?.message);
    }

    return { success: true, message: `Progress evaluation for "${target.name}" recorded successfully!` };
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.id === userId) {
      return { success: false, message: 'Cannot delete the active Super Administrator account.' };
    }

    const targetUser = allUsers.find(u => u.id === userId);

    // Save to deleted set in localStorage so they never reappear on refresh
    const deletedIdsRaw = localStorage.getItem('veyra_deleted_user_ids');
    const deletedArr: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
    deletedArr.push(userId);
    if (targetUser?.email) {
      deletedArr.push(targetUser.email.toLowerCase());
    }
    localStorage.setItem('veyra_deleted_user_ids', JSON.stringify(Array.from(new Set(deletedArr))));

    // Update state and immediately persist
    const updatedUsers = allUsers.filter(u => u.id !== userId);
    setAllUsers(updatedUsers);
    localStorage.setItem('veyra_users_v1', JSON.stringify(updatedUsers));

    // Also call backend API if connected
    api.users.delete(userId).catch(() => {});

    return { success: true, message: 'Account removed successfully.' };
  };

  // ==========================================================
  // LOOKUP HELPER: FIND USER BY STUDENT ID OR USER ID
  // ==========================================================
  const getUserByStudentOrUserId = useCallback((identifier: string): User | undefined => {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();

    // Check memory first
    const found = allUsers.find(u => 
      u.id.toLowerCase() === clean || 
      (u.studentId && u.studentId.toLowerCase() === clean) ||
      u.email.toLowerCase() === clean
    );

    return found;
  }, [allUsers]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        allUsers,
        isAuthModalOpen,
        authModalMode,
        authModalNotice,
        isBackendConnected,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout,
        canManageNode,
        canPublishDirectly,
        canAccessNode,
        enrollInCourse,
        unenrollCourse,
        isEnrolled,
        grantCourseAccess,
        revokeCourseAccess,
        addAdminRemark,
        deleteAdminRemark,
        sendMessageToUser,
        broadcastMessageToAll,
        markNotificationAsRead,
        updateUserRoleAndBranch,
        updateUser,
        changeUserPassword,
        createAdminUser,
        createContentAdminByBranchAdmin,
        evaluateContentAdmin,
        deleteUser,
        getUserByStudentOrUserId,
        isSuperAdmin: currentUser?.role === 'super_admin',
        isBranchAdmin: currentUser?.role === 'branch_admin',
        isContentAdmin: currentUser?.role === 'content_creator' || currentUser?.role === 'content_admin',
        isContentCreator: currentUser?.role === 'content_creator' || currentUser?.role === 'content_admin',
        isReviewer: currentUser?.role === 'reviewer',
        isLearner: currentUser?.role === 'learner',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
