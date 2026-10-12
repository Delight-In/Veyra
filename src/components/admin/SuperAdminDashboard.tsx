import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBlogs } from '../../context/BlogContext';
import { UserRole, ContentNode, User, BranchCategory, AdminTask, NodeType, NodeStatus, BlogPost } from '../../types';
import { initialAdminTasks } from '../../data/initialTasks';
import { MediumBlogEditor } from './MediumBlogEditor';
import { 
  ShieldAlert, Users, Layers, AlertTriangle, CheckCircle, Globe, 
  RefreshCw, Plus, KeyRound, BookOpen, Lock, MessageSquare, Send, FileEdit, 
  Trash2, CheckCircle2, UserCheck, Sparkles, UserPlus, ClipboardList, 
  CheckSquare, Award, Clock, ArrowRight, Copy, Check, Star, ShieldCheck, 
  Mail, Search, ChevronRight, ExternalLink, Eye,
  UserMinus, ShieldOff, AlertOctagon, Pencil, GraduationCap, Edit3
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onOpenCreateNode: (parentId?: string) => void;
  onNavigate?: (page: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onOpenCreateNode, onNavigate }) => {
  const { 
    currentUser, allUsers, grantCourseAccess, revokeCourseAccess,
    addAdminRemark, deleteAdminRemark, sendMessageToUser, broadcastMessageToAll, 
    updateUserRoleAndBranch, updateUser, changeUserPassword, createAdminUser, deleteUser 
  } = useAuth();
  const { 
    nodes, getMissingTranslationNodes, getPendingReviewNodes, resetToInitialData,
    updateNode, deleteNode 
  } = useContent();
  const { blogs, deleteBlog, publishBlog, unpublishBlog } = useBlogs();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'learners' | 'users' | 'messaging' | 'blogs'>('admins');
  
  // Blog / Medium Editor state
  const [isEditingBlog, setIsEditingBlog] = useState<boolean>(false);
  const [editingBlogData, setEditingBlogData] = useState<BlogPost | null>(null);
  const [blogActionNotice, setBlogActionNotice] = useState<string | null>(null);

  // Tasks state (synced with localStorage)
  const [tasks, setTasks] = useState<AdminTask[]>(() => {
    const saved = localStorage.getItem('veyra_admin_tasks_v1');
    return saved ? JSON.parse(saved) : initialAdminTasks;
  });

  useEffect(() => {
    localStorage.setItem('veyra_admin_tasks_v1', JSON.stringify(tasks));
  }, [tasks]);

  // Modals for Remarks and Direct Messaging
  const [remarkModalUser, setRemarkModalUser] = useState<User | null>(null);
  const [newRemarkText, setNewRemarkText] = useState<string>('');
  
  const [messageModalUser, setMessageModalUser] = useState<User | null>(null);
  const [msgTitle, setMsgTitle] = useState<string>('');
  const [msgBody, setMsgBody] = useState<string>('');
  const [isBroadcast, setIsBroadcast] = useState<boolean>(false);
  const [messageSentNotice, setMessageSentNotice] = useState<string | null>(null);

  // Password Change & Random Generation State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [passwordNotice, setPasswordNotice] = useState<{ message: string; pass: string } | null>(null);
  const [isPasswordCopied, setIsPasswordCopied] = useState<boolean>(false);

  // Create Admin Modal State
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState<boolean>(false);
  const [adminName, setAdminName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('Admin@' + Math.floor(100 + Math.random() * 900));
  const [adminRole, setAdminRole] = useState<UserRole>('branch_admin');
  const [adminBranchCat, setAdminBranchCat] = useState<BranchCategory>('pcmb');
  const [adminBranchName, setAdminBranchName] = useState<string>('Natural Sciences & PCMB');
  const [manualAdminRoleMode, setManualAdminRoleMode] = useState<boolean>(false);
  const [manualBranchCatMode, setManualBranchCatMode] = useState<boolean>(false);
  const [manualEditNodeType, setManualEditNodeType] = useState<boolean>(false);
  const [manualEditUserRoleMode, setManualEditUserRoleMode] = useState<boolean>(false);
  const [manualEditUserBranchCatMode, setManualEditUserBranchCatMode] = useState<boolean>(false);
  const [createAdminNotice, setCreateAdminNotice] = useState<string | null>(null);

  // Assign Task Modal State
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState<boolean>(false);
  const [taskTargetAdminId, setTaskTargetAdminId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDesc, setTaskDesc] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [taskDueDate, setTaskDueDate] = useState<string>('2026-03-31');

  // Remove / Delete Admin State
  const [adminToRemove, setAdminToRemove] = useState<User | null>(null);
  const [removeNotice, setRemoveNotice] = useState<string | null>(null);

  // Edit User / Admin State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState<string>('');
  const [editUserEmail, setEditUserEmail] = useState<string>('');
  const [editUserPassword, setEditUserPassword] = useState<string>('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('branch_admin');
  const [editUserBranchCat, setEditUserBranchCat] = useState<BranchCategory>('pcmb');
  const [editUserBranchName, setEditUserBranchName] = useState<string>('');
  const [editUserStudentId, setEditUserStudentId] = useState<string>('');
  const [editUserNotice, setEditUserNotice] = useState<string | null>(null);

  // Edit Task State
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState<string>('');
  const [editTaskDesc, setEditTaskDesc] = useState<string>('');
  const [editTaskPriority, setEditTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [editTaskDueDate, setEditTaskDueDate] = useState<string>('');
  const [editTaskAdminId, setEditTaskAdminId] = useState<string>('');
  const [editTaskStatus, setEditTaskStatus] = useState<AdminTask['status']>('in_progress');
  const [editTaskScore, setEditTaskScore] = useState<number>(95);

  // Add Student Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentEmail, setNewStudentEmail] = useState<string>('');
  const [newStudentPassword, setNewStudentPassword] = useState<string>('Student@' + Math.floor(100 + Math.random() * 900));
  const [addStudentNotice, setAddStudentNotice] = useState<string | null>(null);

  // Search & Filters
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [nodeSearchQuery, setNodeSearchQuery] = useState<string>('');

  // Content Node Edit Modal State
  const [editingContentNode, setEditingContentNode] = useState<ContentNode | null>(null);
  const [editNodeTitleEn, setEditNodeTitleEn] = useState<string>('');
  const [editNodeTitleHi, setEditNodeTitleHi] = useState<string>('');
  const [editNodeDescEn, setEditNodeDescEn] = useState<string>('');
  const [editNodeDescHi, setEditNodeDescHi] = useState<string>('');
  const [editNodeBodyEn, setEditNodeBodyEn] = useState<string>('');
  const [editNodeBodyHi, setEditNodeBodyHi] = useState<string>('');
  const [editNodeType, setEditNodeType] = useState<NodeType>('topic');
  const [editNodeStatus, setEditNodeStatus] = useState<NodeStatus>('published');
  const [editNodeMinutes, setEditNodeMinutes] = useState<number>(10);
  const [editNodeOrder, setEditNodeOrder] = useState<number>(1);
  const [editNodeNotice, setEditNodeNotice] = useState<string | null>(null);

  const missingTranslations = getMissingTranslationNodes();
  const pendingReviews = getPendingReviewNodes();
  const publishedCount = nodes.filter(n => n.status === 'published').length;

  const availableCourseTracks = [
    { id: 'node_science', name: 'Science & PCMB' },
    { id: 'node_math', name: 'Math & Logic' },
    { id: 'node_cs', name: 'Computer Science' },
    { id: 'node_kids_universe', name: 'Kids Zone' },
  ];

  // Admins List (Branch Admins, Creators, Content Admins, Reviewers, Super Admins)
  const systemAdmins = allUsers.filter(u => 
    u.role === 'branch_admin' || u.role === 'content_creator' || u.role === 'content_admin' || u.role === 'reviewer' || u.role === 'super_admin'
  );

  // Normal Users (Learners / Students)
  const normalLearners = allUsers.filter(u => u.role === 'learner');

  // Generate Dummy Random Password
  const handleGenerateRandomPassword = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generatedPass = `Veyra#${randomPart}`;
    
    if (currentUser) {
      await changeUserPassword(currentUser.id, generatedPass);
      setPasswordNotice({
        message: 'Dummy Random Password successfully generated & applied!',
        pass: generatedPass
      });
      setNewPasswordInput(generatedPass);
    }
  };

  const handleApplyCustomPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || !currentUser) return;
    const res = await changeUserPassword(currentUser.id, newPasswordInput.trim());
    if (res.success) {
      setPasswordNotice({
        message: 'Password successfully updated!',
        pass: newPasswordInput.trim()
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsPasswordCopied(true);
    setTimeout(() => setIsPasswordCopied(false), 2000);
  };

  // Create Admin
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) return;

    const res = await createAdminUser({
      name: adminName.trim(),
      email: adminEmail.trim(),
      password: adminPassword,
      role: adminRole,
      branchCategory: adminBranchCat,
      assignedBranchName: adminBranchName,
      assignedNodeId: adminBranchCat === 'cs' ? 'node_cs' : 'node_science'
    });

    if (res.success) {
      setCreateAdminNotice(`Administrator ${adminName} successfully created!`);
      setTimeout(() => {
        setCreateAdminNotice(null);
        setIsCreateAdminOpen(false);
        setAdminName('');
        setAdminEmail('');
      }, 1600);
    } else {
      setCreateAdminNotice(res.message || 'Failed to create administrator.');
    }
  };

  // Assign Task
  const handleAssignTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTargetAdminId || !taskTitle.trim()) return;

    const targetAdmin = systemAdmins.find(a => a.id === taskTargetAdminId);
    if (!targetAdmin) return;

    const newTask: AdminTask = {
      id: `task_${Date.now()}`,
      adminId: targetAdmin.id,
      adminName: targetAdmin.name,
      assignedBy: currentUser?.name || 'Priyanka (Super Admin)',
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Execute assigned branch task in compliance with Veyra syllabus.',
      priority: taskPriority,
      status: 'pending',
      dueDate: taskDueDate,
      createdAt: new Date().toISOString(),
      score: 90
    };

    setTasks(prev => [newTask, ...prev]);
    setIsAssignTaskOpen(false);
    setTaskTitle('');
    setTaskDesc('');
  };

  // Update Task Status
  const handleUpdateTaskStatus = (taskId: string, newStatus: AdminTask['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  // Update Task Score
  const handleUpdateTaskScore = (taskId: string, newScore: number) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, score: newScore } : t));
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Revoke Admin Privileges (Demote to Student/Learner)
  const handleDemoteAdminToLearner = async (targetAdmin: User) => {
    await updateUserRoleAndBranch(targetAdmin.id, {
      role: 'learner',
      assignedBranchName: undefined,
      assignedNodeId: undefined,
      branchCategory: undefined
    });
    await addAdminRemark(targetAdmin.id, `Administrative authority revoked by Super Admin Priyanka on ${new Date().toLocaleDateString()}. Demoted to standard learner.`);
    setRemoveNotice(`Admin privileges successfully revoked for ${targetAdmin.name}. User demoted to Student/Learner.`);
    setTimeout(() => {
      setRemoveNotice(null);
      setAdminToRemove(null);
    }, 1800);
  };

  // Permanently Delete Admin Account
  const handleDeleteAdminAccount = async (targetAdmin: User) => {
    const res = await deleteUser(targetAdmin.id);
    if (res.success) {
      setTasks(prev => prev.filter(t => t.adminId !== targetAdmin.id));
      setRemoveNotice(`Administrator account for ${targetAdmin.name} permanently deleted.`);
      setTimeout(() => {
        setRemoveNotice(null);
        setAdminToRemove(null);
      }, 1800);
    } else {
      setRemoveNotice(res.message || 'Failed to delete user.');
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserPassword(user.password || '');
    setEditUserRole(user.role);
    setEditUserBranchCat(user.branchCategory || 'pcmb');
    setEditUserBranchName(user.assignedBranchName || '');
    setEditUserStudentId(user.studentId || '');
    setEditUserNotice(null);
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await updateUser(editingUser.id, {
      name: editUserName.trim(),
      email: editUserEmail.trim().toLowerCase(),
      password: editUserPassword.trim() || editingUser.password,
      role: editUserRole,
      branchCategory: editUserBranchCat,
      assignedBranchName: editUserBranchName.trim(),
      studentId: editUserStudentId.trim() || undefined
    });

    setEditUserNotice(`User ${editUserName} updated successfully!`);
    setTimeout(() => {
      setEditUserNotice(null);
      setEditingUser(null);
    }, 1400);
  };

  // Open Edit Task
  const handleOpenEditTask = (task: AdminTask) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description);
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.dueDate);
    setEditTaskAdminId(task.adminId);
    setEditTaskStatus(task.status);
    setEditTaskScore(task.score || 90);
  };

  // Save Edit Task
  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const assignedAdmin = systemAdmins.find(a => a.id === editTaskAdminId);

    setTasks(prev => prev.map(t => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          title: editTaskTitle.trim(),
          description: editTaskDesc.trim(),
          priority: editTaskPriority,
          dueDate: editTaskDueDate,
          adminId: editTaskAdminId,
          adminName: assignedAdmin ? assignedAdmin.name : t.adminName,
          status: editTaskStatus,
          score: editTaskScore
        };
      }
      return t;
    }));

    setEditingTask(null);
  };

  // Create Student Handler
  const handleCreateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;

    const cleanEmail = newStudentEmail.trim().toLowerCase();
    const existing = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setAddStudentNotice(`An account with email "${cleanEmail}" already exists.`);
      return;
    }

    const nextId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: User = {
      id: `user_learner_${Date.now()}`,
      studentId: nextId,
      name: newStudentName.trim(),
      email: cleanEmail,
      password: newStudentPassword,
      role: 'learner',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
      preferredLanguage: 'hi',
      isEmailVerified: true,
      enrolledCourseIds: ['node_science'],
      xp: 250,
      streakDays: 1,
      adminRemarks: [
        {
          id: `rem_${Date.now()}`,
          remark: `Student enrolled by Super Admin on ${new Date().toLocaleDateString()}.`,
          author: currentUser?.name || 'Super Admin Priyanka',
          timestamp: new Date().toISOString()
        }
      ],
      notifications: [
        {
          id: `notif_${Date.now()}`,
          sender: currentUser?.name || 'Super Admin Priyanka',
          senderRole: 'super_admin',
          title: 'Welcome to Veyra Learning Platform',
          message: 'Your student account is active.',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]
    };

    await updateUser(newStudent.id, newStudent);
    setAddStudentNotice(`Student ${newStudentName} created successfully! (ID: ${nextId})`);
    setTimeout(() => {
      setAddStudentNotice(null);
      setIsAddStudentOpen(false);
      setNewStudentName('');
      setNewStudentEmail('');
    }, 1500);
  };

  // Delete Student
  const handleDeleteStudent = async (student: User) => {
    if (window.confirm(`Are you sure you want to permanently delete student ${student.name} (${student.studentId})?`)) {
      await deleteUser(student.id);
    }
  };

  // Open Edit Content Node Modal
  const handleOpenEditContentNode = (node: ContentNode) => {
    setEditingContentNode(node);
    setEditNodeTitleEn(node.translations.en?.title || '');
    setEditNodeTitleHi(node.translations.hi?.title || '');
    setEditNodeDescEn(node.translations.en?.description || '');
    setEditNodeDescHi(node.translations.hi?.description || '');
    setEditNodeBodyEn(node.translations.en?.body || '');
    setEditNodeBodyHi(node.translations.hi?.body || '');
    setEditNodeType(node.type);
    setEditNodeStatus(node.status);
    setEditNodeMinutes(node.estimatedMinutes || 10);
    setEditNodeOrder(node.order || 1);
    setEditNodeNotice(null);
  };

  // Save Edit Content Node
  const handleSaveEditContentNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContentNode) return;

    const updatedNode: ContentNode = {
      ...editingContentNode,
      type: editNodeType,
      status: editNodeStatus,
      estimatedMinutes: editNodeMinutes,
      order: editNodeOrder,
      translations: {
        en: {
          language: 'en',
          title: editNodeTitleEn.trim(),
          description: editNodeDescEn.trim(),
          body: editNodeBodyEn.trim(),
          summary: editingContentNode.translations.en?.summary
        },
        hi: editNodeTitleHi.trim() ? {
          language: 'hi',
          title: editNodeTitleHi.trim(),
          description: editNodeDescHi.trim(),
          body: editNodeBodyHi.trim(),
          summary: editingContentNode.translations.hi?.summary
        } : undefined
      }
    };

    updateNode(updatedNode);
    setEditNodeNotice(`Content node "${editNodeTitleEn}" updated successfully!`);
    setTimeout(() => {
      setEditNodeNotice(null);
      setEditingContentNode(null);
    }, 1200);
  };

  // Delete Content Node
  const handleDeleteContentNode = (node: ContentNode) => {
    const title = node.translations.en?.title || node.id;
    if (window.confirm(`Are you sure you want to delete "${title}" (${node.id}) and all of its sub-topics? This cannot be undone.`)) {
      deleteNode(node.id);
    }
  };

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkModalUser || !newRemarkText.trim()) return;
    addAdminRemark(remarkModalUser.id, newRemarkText);
    setNewRemarkText('');
    const updated = allUsers.find(u => u.id === remarkModalUser.id);
    if (updated) setRemarkModalUser(updated);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) return;

    if (isBroadcast) {
      broadcastMessageToAll(msgTitle, msgBody);
      setMessageSentNotice('Official administrative message broadcasted to all registered users!');
    } else if (messageModalUser) {
      sendMessageToUser(messageModalUser.id, msgTitle, msgBody);
      setMessageSentNotice(`Direct message delivered to ${messageModalUser.name}!`);
    }

    setMsgTitle('');
    setMsgBody('');
    setTimeout(() => {
      setMessageSentNotice(null);
      setMessageModalUser(null);
      setIsBroadcast(false);
    }, 1800);
  };

  // Calculate Admin Performance Metrics
  const getAdminMetrics = (adminId: string) => {
    const adminTasks = tasks.filter(t => t.adminId === adminId);
    const completedTasks = adminTasks.filter(t => t.status === 'completed');
    const total = adminTasks.length;
    const completionRate = total > 0 ? Math.round((completedTasks.length / total) * 100) : 100;
    
    // Average score
    const scoredTasks = adminTasks.filter(t => t.score !== undefined);
    const avgScore = scoredTasks.length > 0 
      ? Math.round(scoredTasks.reduce((sum, t) => sum + (t.score || 0), 0) / scoredTasks.length)
      : 95;

    return { total, completed: completedTasks.length, completionRate, avgScore };
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER & SUPER ADMIN PRIYANKA SECURITY CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>{language === 'hi' ? 'सुपर एडमिनिस्ट्रेटर गवर्नेंस कंसोल' : 'Super Administrator Governance Console'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                {language === 'hi' ? 'सर्वोच्च प्राधिकरण' : 'Root Authority'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{currentUser?.name || (language === 'hi' ? 'प्रियंका - संस्थापक एवं मुख्य शैक्षणिक अधिकारी' : 'Priyanka - Founder & CAO')}</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-devanagari leading-relaxed">
              {language === 'hi' 
                ? 'प्रशासक पदानुक्रम, कार्य निर्देश, लाइव प्रदर्शन रेटिंग और सत्यापित अभिभावक-छात्र संबंधों का केंद्रीय प्रबंधन।'
                : 'Managing administrator hierarchies, task directives, live performance ratings, and verified parent-student associations.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
              <span className="font-mono text-[11px] bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-indigo-300">
                Email: {currentUser?.email || 'priyanka@veyra.com'}
              </span>
              <span className="font-mono text-[11px] bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-300">
                Role: super_admin
              </span>
              <span className="font-mono text-[11px] bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-amber-300">
                {language === 'hi' ? 'भौतिकी ऑनर्स एवं आईटी विशेषज्ञ' : 'Physics Honours & IT Specialist'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <KeyRound className="w-4 h-4" />
              <span>{language === 'hi' ? 'पासवर्ड बदलें / डमी पासवर्ड' : 'Change / Dummy Password'}</span>
            </button>

            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('admin/create-blog');
                } else {
                  setEditingBlogData(null);
                  setIsEditingBlog(true);
                }
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'hi' ? 'कहानी लिखें (Medium Editor)' : 'Write Story (Medium Editor)'}</span>
            </button>

            <button
              onClick={() => setIsCreateAdminOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'hi' ? 'प्रशासक बनाएं' : 'Create Administrator'}</span>
            </button>

            <button
              onClick={() => onOpenCreateNode()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? 'नोड जोड़ें' : 'Add Node'}</span>
            </button>

            <button
              onClick={resetToInitialData}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
              title={language === 'hi' ? 'सामग्री वृक्ष को प्रारंभिक डिफ़ॉल्ट पर रीसेट करें' : 'Reset Content Tree to Initial Defaults'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Password Notice Banner if generated */}
        {passwordNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">{passwordNotice.message}</span>
                <div className="font-mono text-white text-xs mt-0.5">
                  {language === 'hi' ? 'नया सक्रिय पासवर्ड: ' : 'New Active Password: '}
                  <span className="bg-slate-900 px-2 py-0.5 rounded font-black text-amber-300 tracking-wider">{passwordNotice.pass}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(passwordNotice.pass)}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 hover:bg-amber-300 transition-all"
            >
              {isPasswordCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isPasswordCopied ? (language === 'hi' ? 'कॉपी किया गया!' : 'Copied!') : (language === 'hi' ? 'पासवर्ड कॉपी करें' : 'Copy Password')}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. PLATFORM METRIC KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{language === 'hi' ? 'प्रशासक' : 'Administrators'}</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">{systemAdmins.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{language === 'hi' ? 'शाखा प्रमुख, निर्माता, समीक्षक' : 'Branch heads, creators, reviewers'}</div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{language === 'hi' ? 'एडमिन कार्य' : 'Admin Tasks'}</span>
            <ClipboardList className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">{language === 'hi' ? 'सफलतापूर्वक पूर्ण किए गए कार्य' : 'Tasks completed successfully'}</div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{language === 'hi' ? 'सक्रिय विद्यार्थी / शिक्षार्थी' : 'Enrolled Students & Learners'}</span>
            <GraduationCap className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1.5 font-mono">
            {normalLearners.length}
          </div>
          <div className="text-[11px] text-sky-600/80 mt-0.5">{language === 'hi' ? 'सक्रिय शिक्षार्थी प्रोफाइल' : 'Active learner profiles'}</div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{language === 'hi' ? 'इंटरैक्टिव लैब्स' : 'Interactive Labs'}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono">{publishedCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">{language === 'hi' ? 'प्रकाशित सिमुलेशन एवं नोड्स' : 'Published simulations & nodes'}</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'admins' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{language === 'hi' ? `प्रशासक एवं कार्य निष्पादन (${systemAdmins.length})` : `Administrators & Task Performance (${systemAdmins.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('learners')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'learners' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{language === 'hi' ? `विद्यार्थी एवं शिक्षार्थी (${normalLearners.length})` : `Students & Learners (${normalLearners.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{language === 'hi' ? 'सामग्री पदानुक्रम वृक्ष' : 'Content Hierarchy Tree'}</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'hi' ? `संपूर्ण उपयोगकर्ता निर्देशिका (${allUsers.length})` : `Full User Directory (${allUsers.length})`}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('messaging');
            setIsBroadcast(true);
            setMessageModalUser(null);
          }}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'messaging' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{language === 'hi' ? 'प्रशासनिक संदेश प्रेषण' : 'Administrative Dispatch'}</span>
        </button>

        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'blogs' 
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>{language === 'hi' ? `आलेख एवं ब्लॉग स्टूडियो (${blogs.length})` : `Stories & Blogs (Medium Studio) (${blogs.length})`}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADMINISTRATORS & TASK PERFORMANCE */}
      {/* ========================================================================= */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Section A: Administrators Roster & Performance Overview */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>Administrator Roster & Real-Time Performance Ratings</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Super Admin Priyanka can inspect all branch administrators, assign tasks, and monitor completion rates and quality scores.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateAdminOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Create New Admin</span>
                </button>
                <button
                  onClick={() => {
                    setIsAssignTaskOpen(true);
                    if (systemAdmins.length > 0) setTaskTargetAdminId(systemAdmins[0].id);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>+ Assign Task</span>
                </button>
              </div>
            </div>

            {/* Administrators Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Administrator & Credentials</th>
                    <th className="p-3">Role & Assigned Branch</th>
                    <th className="p-3">Task Completion</th>
                    <th className="p-3">Performance Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {systemAdmins.map(admin => {
                    const metrics = getAdminMetrics(admin.id);
                    return (
                      <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={admin.avatar} 
                              alt={admin.name} 
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0" 
                            />
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{admin.name}</span>
                                {admin.id === currentUser?.id && (
                                  <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[9px] rounded font-mono font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{admin.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                admin.role === 'branch_admin'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : admin.role === 'content_admin' || admin.role === 'content_creator'
                                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                  : 'bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 border border-slate-200 dark:border-slate-700'
                              }`}>
                                {admin.role === 'branch_admin' ? 'BRANCH ADMIN' : admin.role === 'content_admin' ? 'CONTENT ADMIN' : admin.role.replace('_', ' ').toUpperCase()}
                              </span>
                              {admin.role === 'branch_admin' && (
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                  ({allUsers.filter(u => u.createdBy === admin.id).length} Content Admins)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {admin.assignedBranchName || (admin.branchCategory === 'cs' ? 'Computer Science & AI' : 'Natural Sciences & PCMB')}
                            </div>
                            {admin.createdBy && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>Supervised by:</span>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  {allUsers.find(u => u.id === admin.createdBy)?.name || 'Branch Admin'}
                                </span>
                              </div>
                            )}
                            {admin.performanceScore !== undefined && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                Quality Score: {admin.performanceScore}/100 ({admin.evaluationRating || 5}★)
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1.5 min-w-[130px]">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{metrics.completed} / {metrics.total} Done</span>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.completionRate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${metrics.completionRate}%` }} 
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                              {metrics.avgScore}
                            </span>
                            <span className="text-[10px] text-slate-400">/ 100</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {metrics.avgScore >= 95 ? 'Exceptional' : metrics.avgScore >= 90 ? 'High Standard' : 'Good Standing'}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(admin)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center gap-1 transition-all"
                              title="Edit administrator details and credentials"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                setTaskTargetAdminId(admin.id);
                                setIsAssignTaskOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center gap-1"
                              title="Assign directive to this administrator"
                            >
                              <ClipboardList className="w-3 h-3" />
                              <span>Assign</span>
                            </button>

                            <button
                              onClick={() => {
                                setMessageModalUser(admin);
                                setIsBroadcast(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
                              title="Direct message this administrator"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Message</span>
                            </button>

                            {admin.id !== currentUser?.id ? (
                              <button
                                onClick={() => setAdminToRemove(admin)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center gap-1 transition-all"
                                title="Remove admin privileges or delete admin account"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5">
                                Root Admin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: All Assigned Tasks & Directives Engine */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  <span>Assigned Directives & Task Pipeline</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Super Admin can modify status, update quality scores, or dispatch new tasks to any administrator.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAssignTaskOpen(true);
                  if (systemAdmins.length > 0) setTaskTargetAdminId(systemAdmins[0].id);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign New Task</span>
              </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  No tasks currently assigned. Click "Assign New Task" to delegate directives.
                </div>
              ) : (
                tasks.map(task => {
                  const isDone = task.status === 'completed';
                  const isProgress = task.status === 'in_progress';

                  return (
                    <div 
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDone 
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800' 
                          : isProgress
                          ? 'bg-indigo-50/20 dark:bg-indigo-950/15 border-indigo-200 dark:border-indigo-900/60'
                          : 'bg-amber-50/20 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                              task.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : task.priority === 'high'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {task.priority}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {task.title}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {task.description}
                          </p>

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                            <span>Assigned To: <strong className="text-slate-800 dark:text-slate-200">{task.adminName}</strong></span>
                            <span>Due Date: <strong className="text-slate-800 dark:text-slate-200">{task.dueDate}</strong></span>
                            <span>Assigned By: {task.assignedBy}</span>
                          </div>
                        </div>

                        {/* Controls: Status, Score, Delete */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                          {/* Status Selector */}
                          <select
                            value={task.status}
                            onChange={e => handleUpdateTaskStatus(task.id, e.target.value as AdminTask['status'])}
                            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                : isProgress
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
                                : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            }`}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="in_progress">⚙️ In Progress</option>
                            <option value="completed">✅ Completed</option>
                          </select>

                          {/* Score Display / Input */}
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={task.score || 95}
                              onChange={e => handleUpdateTaskScore(task.id, Number(e.target.value))}
                              className="w-10 text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent outline-none"
                              title="Set quality evaluation score (0-100)"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">pts</span>
                          </div>

                          <button
                            onClick={() => handleOpenEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit task directive details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete task directive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENTS & LEARNERS */}
      {/* ========================================================================= */}
      {activeTab === 'learners' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>Enrolled Students & Learners Directory</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Directory of all active learners, their enrolled course tracks, XP progress, and streak activity.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name or ID..."
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={() => {
                  setIsAddStudentOpen(true);
                  setAddStudentNotice(null);
                  setNewStudentPassword('Learner@' + Math.floor(1000 + Math.random() * 9000));
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Student & ID</th>
                  <th className="p-3">Progress & Activity</th>
                  <th className="p-3">Enrolled Courses</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {normalLearners
                  .filter(learner => {
                    if (!studentSearchQuery.trim()) return true;
                    const q = studentSearchQuery.toLowerCase();
                    return (
                      learner.name.toLowerCase().includes(q) ||
                      (learner.studentId && learner.studentId.toLowerCase().includes(q)) ||
                      learner.email.toLowerCase().includes(q)
                    );
                  })
                  .map(learner => {
                    return (
                      <tr key={learner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Student Info */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={learner.avatar} 
                              alt={learner.name} 
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0" 
                            />
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white">
                                {learner.name}
                              </div>
                              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                                ID: {learner.studentId || 'STU-1001'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{learner.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                              XP: <strong className="text-indigo-600 dark:text-indigo-400">{learner.xp}</strong>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Streak: <strong className="text-amber-600 dark:text-amber-400">{learner.streakDays}d</strong>
                            </div>
                          </div>
                        </td>

                        {/* Enrolled Courses */}
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {learner.enrolledCourseIds && learner.enrolledCourseIds.length > 0 ? (
                              learner.enrolledCourseIds.map(cid => (
                                <span key={cid} className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {cid.replace('node_', '').toUpperCase()}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No courses enrolled</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active Learner</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(learner)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center gap-1 transition-all"
                              title="Edit student details"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                setMessageModalUser(learner);
                                setMsgTitle(`Official Notice regarding Student: ${learner.name}`);
                                setIsBroadcast(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center gap-1"
                              title="Message student"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Notify</span>
                            </button>

                            <button
                              onClick={() => setRemarkModalUser(learner)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1"
                              title="Write observation remark on student"
                            >
                              <FileEdit className="w-3 h-3 text-amber-600" />
                              <span>Remarks ({learner.adminRemarks?.length || 0})</span>
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(learner)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center gap-1 transition-all"
                              title="Delete student account"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTENT HIERARCHY TREE */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Global Content Hierarchy Tree (ltree Materialized Path)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Recursive content tree for multi-disciplinary simulations, lessons, videos, and retention quizzes.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  value={nodeSearchQuery}
                  onChange={e => setNodeSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={() => onOpenCreateNode()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-md transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Node</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {nodes
              .filter(n => {
                if (!nodeSearchQuery.trim()) return true;
                const q = nodeSearchQuery.toLowerCase();
                return (
                  n.id.toLowerCase().includes(q) ||
                  n.type.toLowerCase().includes(q) ||
                  (n.translations.en?.title && n.translations.en.title.toLowerCase().includes(q)) ||
                  (n.translations.hi?.title && n.translations.hi.title.toLowerCase().includes(q))
                );
              })
              .map(n => {
                const hasHindi = !!n.translations.hi?.title;
                return (
                  <div key={n.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors gap-2">
                    <div className="flex items-center gap-2 overflow-hidden" style={{ paddingLeft: `${n.depth * 18}px` }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="font-mono text-[10px] text-slate-400 uppercase">[{n.type}]</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {n.translations.en?.title || n.id}
                      </span>
                      {hasHindi && (
                        <span className="text-slate-400 text-[11px] font-devanagari truncate">
                          ({n.translations.hi?.title})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!hasHindi && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px]">
                          Missing Hindi
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.status === 'published' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : n.status === 'in_review' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {n.status}
                      </span>

                      {n.status !== 'published' && (
                        <button
                          onClick={() => updateNode({ ...n, status: 'published' })}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs"
                          title="Publish this node immediately so it appears on Student Dashboards"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Publish</span>
                        </button>
                      )}

                      {/* Edit Node Button */}
                      <button
                        onClick={() => handleOpenEditContentNode(n)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center gap-1 transition-all"
                        title="Edit node translations, status, and properties"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {/* Add Sub-topic Button */}
                      <button
                        onClick={() => onOpenCreateNode(n.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 text-[10px] flex items-center gap-1 transition-all"
                        title="Add child node under this node"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Sub-topic</span>
                      </button>

                      {/* Delete Node Button */}
                      <button
                        onClick={() => handleDeleteContentNode(n)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                        title="Delete this node and all child topics"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FULL USER DIRECTORY & COURSE ACCESS */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Global User Directory, Remarks & Course Track Grants
              </h3>
              <p className="text-xs text-slate-400">
                Grant or revoke course track access across Science, Math, CS, and Kids Universe.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">User & Credentials</th>
                  <th className="p-3">Role & Scope</th>
                  <th className="p-3">Course Tracks</th>
                  <th className="p-3">Internal Remarks</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {allUsers.map(u => {
                  const remarksCount = u.adminRemarks?.length || 0;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {u.studentId ? `ID: ${u.studentId} • ` : ''}{u.email}
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {u.role}
                        </span>
                        {u.assignedBranchName && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 truncate max-w-[140px]">
                            {u.assignedBranchName}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {availableCourseTracks.map(ct => {
                            const hasAccess = u.enrolledCourseIds?.includes(ct.id) || u.role === 'super_admin';
                            return (
                              <button
                                key={ct.id}
                                onClick={() => {
                                  if (u.role === 'super_admin') return;
                                  if (hasAccess) revokeCourseAccess(u.id, ct.id);
                                  else grantCourseAccess(u.id, ct.id);
                                }}
                                disabled={u.role === 'super_admin'}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                  hasAccess
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-400 hover:text-slate-700 dark:bg-slate-800 dark:hover:text-slate-200'
                                }`}
                                title={hasAccess ? 'Click to revoke access' : 'Click to grant access'}
                              >
                                {hasAccess ? `✓ ${ct.name.split(' ')[0]}` : `+ ${ct.name.split(' ')[0]}`}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => setRemarkModalUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 transition-all"
                        >
                          <FileEdit className="w-3 h-3 text-amber-600" />
                          <span>Remarks ({remarksCount})</span>
                        </button>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 font-bold text-[10px] flex items-center gap-1 transition-all"
                            title="Edit user details and credentials"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              setMessageModalUser(u);
                              setIsBroadcast(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1"
                            title="Direct message user"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Message</span>
                          </button>

                          {u.id !== currentUser?.id ? (
                            <button
                              onClick={() => {
                                if (u.role === 'branch_admin' || u.role === 'content_creator' || u.role === 'super_admin') {
                                  setAdminToRemove(u);
                                } else {
                                  handleDeleteStudent(u);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center gap-1 transition-all"
                              title="Delete user or revoke role"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5">
                              Root Admin
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ADMINISTRATIVE DIRECT MESSAGING */}
      {/* ========================================================================= */}
      {activeTab === 'messaging' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>Super Admin Communication & Dispatch Console</span>
              </h3>
              <p className="text-xs text-slate-400">
                Transmit high-priority administrative decrees, academic commendations, or branch directives.
              </p>
            </div>
          </div>

          {messageSentNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{messageSentNotice}</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Target
              </label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="recipType"
                    checked={isBroadcast}
                    onChange={() => setIsBroadcast(true)}
                    className="accent-indigo-600"
                  />
                  <span>📢 Broadcast to ALL Registered Users</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="recipType"
                    checked={!isBroadcast}
                    onChange={() => setIsBroadcast(false)}
                    className="accent-indigo-600"
                  />
                  <span>Direct Message Specific User</span>
                </label>
              </div>
            </div>

            {!isBroadcast && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select User:
                </label>
                <select
                  value={messageModalUser?.id || ''}
                  onChange={e => {
                    const found = allUsers.find(u => u.id === e.target.value);
                    if (found) setMessageModalUser(found);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Select recipient...</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Message Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule Update for Physics Practical / Academic Commendation"
                value={msgTitle}
                onChange={e => setMsgTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Directive Body / Notice Text *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Compose administrative message..."
                value={msgBody}
                onChange={e => setMsgBody(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>{isBroadcast ? 'Broadcast to All Users' : 'Send Direct Message'}</span>
            </button>
          </form>
        </div>
      )}
      {/* ========================================================================= */}
      {/* TAB 6: STORIES & BLOGS (MEDIUM PUBLICATION STUDIO) */}
      {/* ========================================================================= */}
      {activeTab === 'blogs' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Medium Publication Studio • Stories by Super Admin Priyanka</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distraction-free Medium writing environment to write essays, simulation science breakthroughs, and cognitive research articles. Published stories are immediately visible to all learners and visitors in the public Blogs section.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('admin/create-blog');
                    } else {
                      setEditingBlogData(null);
                      setIsEditingBlog(true);
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write a Story (Medium Editor)</span>
                </button>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('blogs')}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    <span>View Public Blog Feed</span>
                  </button>
                )}
              </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Stories</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">{blogs.length}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">Published Publicly</div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                  {blogs.filter(b => b.status === 'published').length}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold">Drafts</div>
                <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">
                  {blogs.filter(b => b.status === 'draft').length}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <div className="text-[10px] font-mono uppercase text-purple-600 dark:text-purple-400 font-bold">Total Claps</div>
                <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1 font-mono">
                  👏 {blogs.reduce((acc, b) => acc + (b.claps || 0), 0)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <div className="text-[10px] font-mono uppercase text-sky-600 dark:text-sky-400 font-bold">Total Views</div>
                <div className="text-xl font-black text-sky-700 dark:text-sky-300 mt-1 font-mono">
                  👁️ {blogs.reduce((acc, b) => acc + (b.views || 0), 0)}
                </div>
              </div>
            </div>

            {/* Action Notice Banner */}
            {blogActionNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{blogActionNotice}</span>
              </div>
            )}

            {/* Stories Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Story & Thumbnail</th>
                    <th className="p-3">Topics & Scope</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Claps & Reads</th>
                    <th className="p-3">Published Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {blogs.map(story => (
                    <tr key={story.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Title & Cover */}
                      <td className="p-3 max-w-sm">
                        <div className="flex items-center gap-3">
                          {story.coverImage && (
                            <img
                              src={story.coverImage}
                              alt={story.title}
                              className="w-14 h-11 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                          )}
                          <div className="overflow-hidden">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {story.title}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {story.subtitle || story.content.slice(0, 80)}
                            </div>
                            <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                              {story.readingTimeMinutes} min read {story.featured ? '• ★ Featured' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Topics */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {story.tags.slice(0, 2).map(t => (
                            <span key={t} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase inline-flex items-center gap-1 ${
                          story.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${story.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {story.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Claps & Reads */}
                      <td className="p-3">
                        <div className="font-mono text-[11px] space-y-0.5">
                          <div className="text-amber-600 dark:text-amber-400 font-bold">👏 {story.claps} claps</div>
                          <div className="text-slate-400">👁️ {story.views} views</div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-[11px] font-mono text-slate-500">
                        {new Date(story.publishedAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit in Medium Editor */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigate) {
                                window.history.pushState(null, '', `/admin/create-blog?id=${encodeURIComponent(story.id)}`);
                                onNavigate('admin/create-blog');
                              } else {
                                setEditingBlogData(story);
                                setIsEditingBlog(true);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                            title="Edit story in Medium Editor (/admin/create-blog)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Publish / Unpublish */}
                          {story.status === 'published' ? (
                            <button
                              type="button"
                              onClick={() => {
                                unpublishBlog(story.id);
                                setBlogActionNotice(`"${story.title}" set to Draft.`);
                                setTimeout(() => setBlogActionNotice(null), 2000);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-100 transition-colors"
                              title="Unpublish story"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                publishBlog(story.id);
                                setBlogActionNotice(`"${story.title}" published publicly!`);
                                setTimeout(() => setBlogActionNotice(null), 2000);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                              title="Publish story now"
                            >
                              Publish
                            </button>
                          )}

                          {/* Preview Public Story */}
                          {onNavigate && story.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  window.history.pushState(null, '', `/blogs?id=${encodeURIComponent(story.id)}`);
                                }
                                onNavigate('blogs');
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                              title="View published story"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Story */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${story.title}"?`)) {
                                deleteBlog(story.id);
                                setBlogActionNotice(`"${story.title}" deleted.`);
                                setTimeout(() => setBlogActionNotice(null), 2000);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Delete story"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CHANGE / GENERATE DUMMY RANDOM PASSWORD FOR PRIYANKA */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Super Admin Credentials Management
                </h4>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">Administrator: <span className="text-slate-900 dark:text-white font-bold">{currentUser?.name}</span></div>
                <div className="text-slate-400">Account Email: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currentUser?.email}</span></div>
                <div className="text-slate-400">Current Password: <span className="text-amber-500 font-bold">{currentUser?.password || '••••••••'}</span></div>
              </div>

              {/* 1-Click Generate Dummy Random Password */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-2.5">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>One-Click Dummy Random Password Generator</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Generate a high-entropy random password instantly (e.g. <code>Veyra#9kL2xP!7</code>) and apply it to this Super Admin profile.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate & Apply Random Password Now</span>
                </button>
              </div>

              {/* Manual Password Input */}
              <form onSubmit={handleApplyCustomPassword} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Or Set Custom Password Manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter new custom password..."
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE ADMINISTRATOR MODAL */}
      {/* ========================================================================= */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Provision New Administrator
                </h4>
              </div>
              <button
                onClick={() => setIsCreateAdminOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {createAdminNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{createAdminNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdminSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma, Prof. Meera Nair"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.admin@veyra.com"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Role Authority *
                    </label>
                    <button
                      type="button"
                      onClick={() => setManualAdminRoleMode(!manualAdminRoleMode)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {manualAdminRoleMode ? '☰ Pick from list' : '✍️ Type custom role'}
                    </button>
                  </div>
                  {manualAdminRoleMode ? (
                    <input
                      type="text"
                      placeholder="e.g. lab_coordinator, curriculum_lead"
                      value={adminRole}
                      onChange={e => setAdminRole(e.target.value as UserRole)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  ) : (
                    <select
                      value={adminRole}
                      onChange={e => setAdminRole(e.target.value as UserRole)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="branch_admin">Branch Administrator (Discipline Head & Content Admin Manager)</option>
                      <option value="content_creator">Direct Content Creator</option>
                      <option value="reviewer">Peer & Language Reviewer</option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Branch Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setManualBranchCatMode(!manualBranchCatMode)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {manualBranchCatMode ? '☰ Pick from list' : '✍️ Type custom category'}
                    </button>
                  </div>
                  {manualBranchCatMode ? (
                    <input
                      type="text"
                      placeholder="e.g. robotics, astrophysics, linguistics"
                      value={adminBranchCat}
                      onChange={e => {
                        const val = e.target.value as BranchCategory;
                        setAdminBranchCat(val);
                        if (!adminBranchName) setAdminBranchName(val);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  ) : (
                    <select
                      value={adminBranchCat}
                      onChange={e => {
                        const cat = e.target.value as BranchCategory;
                        setAdminBranchCat(cat);
                        if (cat === 'cs') setAdminBranchName('Computer Science & AI (संगणक विज्ञान)');
                        else if (cat === 'pcmb') setAdminBranchName('Natural Sciences & PCMB (प्राकृतिक विज्ञान)');
                        else setAdminBranchName('Language Review & Humanities');
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="pcmb">PCMB Sciences (Physics, Chem, Math, Bio)</option>
                      <option value="cs">Computer Science & Algorithms</option>
                      <option value="other">General / Language Translation</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Branch Scope / Lab Name *
                </label>
                <input
                  type="text"
                  required
                  value={adminBranchName}
                  onChange={e => setAdminBranchName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setAdminPassword('Admin@' + Math.floor(100 + Math.random() * 900))}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md"
                >
                  Provision Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN TASK DIRECTIVE MODAL */}
      {/* ========================================================================= */}
      {isAssignTaskOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Assign Administrative Directive
                </h4>
              </div>
              <button
                onClick={() => setIsAssignTaskOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Administrator *
                </label>
                <select
                  value={taskTargetAdminId}
                  onChange={e => setTaskTargetAdminId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {systemAdmins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name} ({admin.role.replace('_', ' ')}) — {admin.assignedBranchName || 'Branch'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Directive Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Wave Optics Simulation Wavelength Sliders"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Directive Instructions / Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, test cases, formulas, or bilingual translation guidelines..."
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟡 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignTaskOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md"
                >
                  Assign Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REMARKS MODAL DIALOG */}
      {/* ========================================================================= */}
      {remarkModalUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-amber-500" />
                  <span>Administrative Remarks on {remarkModalUser.name}</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">{remarkModalUser.email}</span>
              </div>
              <button
                onClick={() => setRemarkModalUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* List Existing Remarks */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {(!remarkModalUser.adminRemarks || remarkModalUser.adminRemarks.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No internal remarks recorded yet for this user.
                </div>
              ) : (
                remarkModalUser.adminRemarks.map(rem => (
                  <div key={rem.id} className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>By {rem.author}</span>
                      <span>{new Date(rem.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200">{rem.remark}</p>
                    <div className="text-right pt-1">
                      <button
                        onClick={() => {
                          deleteAdminRemark(remarkModalUser.id, rem.id);
                          const updated = allUsers.find(u => u.id === remarkModalUser.id);
                          if (updated) setRemarkModalUser(updated);
                        }}
                        className="text-[10px] text-rose-500 hover:underline inline-flex items-center gap-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New Remark Form */}
            <form onSubmit={handleAddRemark} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Add New Remark (Internal Note):
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter academic observation, compliance verification, or conduct remark..."
                value={newRemarkText}
                onChange={e => setNewRemarkText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRemarkModalUser(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  Save Remark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REMOVE / DELETE ADMINISTRATOR DIALOG */}
      {/* ========================================================================= */}
      {adminToRemove && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Remove Administrator Authority
                </h4>
              </div>
              <button
                onClick={() => {
                  setAdminToRemove(null);
                  setRemoveNotice(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {removeNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{removeNotice}</span>
              </div>
            )}

            {/* Target Admin Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <img
                src={adminToRemove.avatar}
                alt={adminToRemove.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-rose-500/30 shrink-0"
              />
              <div className="overflow-hidden">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {adminToRemove.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {adminToRemove.email}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider font-mono mt-0.5">
                  Role: {adminToRemove.role} • Scope: {adminToRemove.assignedBranchName || 'General'}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-devanagari">
              Choose an administrative action for this user. You can either revoke their administrative privileges (demoting them to a standard student) or permanently delete the user account.
            </p>

            {/* Two Action Options */}
            <div className="space-y-3">
              {/* Option A: Demote to Learner */}
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-extrabold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <ShieldOff className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Option 1: Demote to Student / Learner (Recommended)</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                    Revokes all administrative access and branch scopes, but preserves the user's account and learning history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDemoteAdminToLearner(adminToRemove)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shrink-0 shadow-sm transition-all"
                >
                  Revoke & Demote
                </button>
              </div>

              {/* Option B: Permanently Delete Account */}
              <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-extrabold text-xs text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Option 2: Permanently Delete Admin Account</span>
                  </div>
                  <p className="text-[11px] text-rose-800/90 dark:text-rose-300/90">
                    Completely deletes this user from Veyra and cancels any task directives assigned to them.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAdminAccount(adminToRemove)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shrink-0 shadow-sm transition-all"
                >
                  Delete Account
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setAdminToRemove(null);
                  setRemoveNotice(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT USER / ADMIN / STUDENT MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Edit User Account & Attributes
                </h4>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {editUserNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editUserNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              {/* User Avatar & Basic Info Header */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <img
                  src={editingUser.avatar}
                  alt={editingUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                />
                <div className="overflow-hidden">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    User ID: <span className="font-mono text-indigo-600 dark:text-indigo-400">{editingUser.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    Current Role: <span className="font-bold uppercase">{editingUser.role}</span>
                  </div>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={e => setEditUserName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={e => setEditUserEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Password & Generator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Password / Reset Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = 'Veyra@' + Math.random().toString(36).substring(2, 8) + '!';
                      setEditUserPassword(gen);
                    }}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter or generate new password"
                    value={editUserPassword}
                    onChange={e => setEditUserPassword(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Account Role
                  </label>
                  {editingUser.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => setManualEditUserRoleMode(!manualEditUserRoleMode)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {manualEditUserRoleMode ? '☰ List' : '✍️ Custom'}
                    </button>
                  )}
                </div>
                {manualEditUserRoleMode && editingUser.id !== currentUser?.id ? (
                  <input
                    type="text"
                    placeholder="Custom role..."
                    value={editUserRole}
                    onChange={e => setEditUserRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                ) : (
                  <select
                    value={editUserRole}
                    onChange={e => setEditUserRole(e.target.value as UserRole)}
                    disabled={editingUser.id === currentUser?.id}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="learner">Student / Learner (Learner)</option>
                    <option value="branch_admin">Branch Administrator (Branch Admin)</option>
                    <option value="content_admin">Content Administrator (Content Admin)</option>
                    <option value="content_creator">Course Content Creator (Creator)</option>
                    <option value="super_admin">Super Administrator (Super Admin)</option>
                  </select>
                )}
                {editingUser.id === currentUser?.id && (
                  <p className="text-[10px] text-slate-400 italic">Root super admin role cannot be downgraded.</p>
                )}
              </div>

              {/* Conditional Fields: Admin Branches */}
              {(editUserRole === 'branch_admin' || editUserRole === 'content_creator' || editUserRole === 'content_admin') && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
                  <div className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200">
                    Administrator Scope & Branch
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Branch Category
                        </label>
                        <button
                          type="button"
                          onClick={() => setManualEditUserBranchCatMode(!manualEditUserBranchCatMode)}
                          className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          {manualEditUserBranchCatMode ? '☰ List' : '✍️ Custom'}
                        </button>
                      </div>
                      {manualEditUserBranchCatMode ? (
                        <input
                          type="text"
                          placeholder="Custom category..."
                          value={editUserBranchCat}
                          onChange={e => setEditUserBranchCat(e.target.value as BranchCategory)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        />
                      ) : (
                        <select
                          value={editUserBranchCat}
                          onChange={e => setEditUserBranchCat(e.target.value as BranchCategory)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="pcmb">PCMB (Natural Sciences & Math)</option>
                          <option value="cs">Computer Science & AI Universe</option>
                          <option value="other">General / Other Discipline</option>
                        </select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Assigned Branch Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Computer Science & Python"
                        value={editUserBranchName}
                        onChange={e => setEditUserBranchName(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields: Student Information */}
              {editUserRole === 'learner' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Student Profile & Identification</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Student ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. STU-1001"
                      value={editUserStudentId}
                      onChange={e => setEditUserStudentId(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: EDIT TASK DIRECTIVE MODAL */}
      {/* ========================================================================= */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Edit Task Directive
                </h4>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Directive Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTaskTitle}
                  onChange={e => setEditTaskTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Instructions & Scope *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editTaskDesc}
                  onChange={e => setEditTaskDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Assigned Administrator
                  </label>
                  <select
                    value={editTaskAdminId}
                    onChange={e => setEditTaskAdminId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {systemAdmins.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role.replace('_', ' ').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Priority Level
                  </label>
                  <select
                    value={editTaskPriority}
                    onChange={e => setEditTaskPriority(e.target.value as AdminTask['priority'])}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟡 High</option>
                    <option value="normal">🔵 Normal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={editTaskDueDate}
                    onChange={e => setEditTaskDueDate(e.target.value)}
                    placeholder="e.g. 2026-10-25"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Execution Status
                  </label>
                  <select
                    value={editTaskStatus}
                    onChange={e => setEditTaskStatus(e.target.value as AdminTask['status'])}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">⚙️ In Progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Quality Evaluation Score (0 - 100)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editTaskScore}
                    onChange={e => setEditTaskScore(Number(e.target.value))}
                    className="w-24 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400">points</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Directive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: CREATE / ENROLL STUDENT & ASSOCIATED PARENT RECORD */}
      {/* ========================================================================= */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Add New Student & Learner Record
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Create credentials and enroll a new student learner in the platform.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {addStudentNotice && (
              <div className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                addStudentNotice.includes('already exists')
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{addStudentNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudentSubmit} className="space-y-4">
              {/* Student Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Diya Sharma"
                      value={newStudentName}
                      onChange={e => setNewStudentName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Student Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="diya.student@edunova.edu"
                      value={newStudentEmail}
                      onChange={e => setNewStudentEmail(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Default Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewStudentPassword('Learner@' + Math.floor(1000 + Math.random() * 9000))}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Randomize
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newStudentPassword}
                    onChange={e => setNewStudentPassword(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Student Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: EDIT CONTENT HIERARCHY NODE */}
      {/* ========================================================================= */}
      {editingContentNode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Edit Content Node: {editingContentNode.translations.en?.title || editingContentNode.id}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {editingContentNode.id} • Path: {editingContentNode.path} • Depth: {editingContentNode.depth}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingContentNode(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {editNodeNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editNodeNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditContentNode} className="space-y-4">
              {/* Type, Status, Estimated Minutes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Node Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setManualEditNodeType(!manualEditNodeType)}
                      className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {manualEditNodeType ? '☰ List' : '✍️ Custom'}
                    </button>
                  </div>
                  {manualEditNodeType ? (
                    <input
                      type="text"
                      placeholder="e.g. topic, experiment, lecture"
                      value={editNodeType}
                      onChange={e => setEditNodeType(e.target.value as NodeType)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  ) : (
                    <select
                      value={editNodeType}
                      onChange={e => setEditNodeType(e.target.value as NodeType)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="category">Category (श्रेणी)</option>
                      <option value="subject">Subject (विषय)</option>
                      <option value="topic">Topic (मुख्य अध्याय)</option>
                      <option value="subtopic">Subtopic (उप-विषय)</option>
                      <option value="sub_subtopic">Sub-subtopic (अति-सूक्ष्म)</option>
                      <option value="lesson">Lesson (पाठ)</option>
                      <option value="simulation">Simulation (सिमुलेशन)</option>
                      <option value="video">Video (वीडियो)</option>
                      <option value="quiz">Quiz (प्रश्नोत्तरी)</option>
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    Status
                  </label>
                  <select
                    value={editNodeStatus}
                    onChange={e => setEditNodeStatus(e.target.value as NodeStatus)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="draft">Draft (प्रारूप)</option>
                    <option value="in_review">In Review (समीक्षाधीन)</option>
                    <option value="published">Published (प्रकाशित)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editNodeMinutes}
                    onChange={e => setEditNodeMinutes(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Side-by-Side Multilingual Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* English Column */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>🇬🇧 English Content</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editNodeTitleEn}
                      onChange={e => setEditNodeTitleEn(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Description / Overview
                    </label>
                    <textarea
                      rows={3}
                      value={editNodeDescEn}
                      onChange={e => setEditNodeDescEn(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Detailed Body / Theory (Markdown)
                    </label>
                    <textarea
                      rows={4}
                      value={editNodeBodyEn}
                      onChange={e => setEditNodeBodyEn(e.target.value)}
                      placeholder="# Concept Explanation..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Hindi Column */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>🇮🇳 हिंदी सामग्री (Devanagari Translation)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      शीर्षक (Hindi Title)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. गति के नियम और संवेग"
                      value={editNodeTitleHi}
                      onChange={e => setEditNodeTitleHi(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      संक्षिप्त विवरण (Hindi Description)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="उदा. इस अध्याय में भौतिकी के मूलभूत नियमों का अध्ययन..."
                      value={editNodeDescHi}
                      onChange={e => setEditNodeDescHi(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      विस्तृत व्याख्या (Hindi Body)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="उदा. # भौतिकीय संकल्पना..."
                      value={editNodeBodyHi}
                      onChange={e => setEditNodeBodyHi(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteContentNode(editingContentNode)}
                  className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Node</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingContentNode(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Node Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MEDIUM BLOG WRITER OVERLAY */}
      {/* ========================================================================= */}
      {isEditingBlog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-[#080C14]">
          <MediumBlogEditor
            initialBlog={editingBlogData}
            onClose={() => {
              setIsEditingBlog(false);
              setEditingBlogData(null);
            }}
            onPublished={(saved) => {
              setBlogActionNotice(`"${saved.title}" published publicly on Veyra!`);
              setTimeout(() => setBlogActionNotice(null), 3000);
            }}
          />
        </div>
      )}
    </div>
  );
};
