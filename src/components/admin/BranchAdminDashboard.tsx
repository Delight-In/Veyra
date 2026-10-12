import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { PcmbWorkbench } from './branches/PcmbWorkbench';
import { ComputerScienceWorkbench } from './branches/ComputerScienceWorkbench';
import { OtherBranchWorkbench } from './branches/OtherBranchWorkbench';
import { MarkdownPreview } from './MarkdownPreview';
import { ContentNode, NodeType, NodeStatus, User } from '../../types';
import { 
  GitBranch, Plus, CheckCircle2, Clock, AlertTriangle, Layers, 
  Users, KeyRound, Sparkles, UserCheck, ShieldCheck, PlayCircle, BookOpen, Binary, Atom,
  Pencil, Trash2, Check, MessageSquare, Star, Eye, Send, FileEdit, Award, ChevronRight, X,
  AlertCircle, ThumbsUp, RefreshCw, UserPlus, HelpCircle
} from 'lucide-react';

interface BranchAdminDashboardProps {
  onOpenCreateNode: (parentId?: string) => void;
}

export const BranchAdminDashboard: React.FC<BranchAdminDashboardProps> = ({ onOpenCreateNode }) => {
  const { 
    currentUser, allUsers, grantCourseAccess, revokeCourseAccess,
    createContentAdminByBranchAdmin, evaluateContentAdmin 
  } = useAuth();
  const { 
    nodes, getNodeById, updateNodeStatus, updateNode, deleteNode,
    approveAndMakePublic, requestRevisionWithRemark 
  } = useContent();
  const { language, t } = useLanguage();

  const assignedNodeId = currentUser?.assignedNodeId || 'node_science';
  const assignedNode = getNodeById(assignedNodeId);

  // Determine specialized discipline branch category: 'pcmb' | 'cs' | 'other'
  const branchCategory = currentUser?.branchCategory || 
    (assignedNodeId === 'node_cs' ? 'cs' : assignedNodeId === 'node_science' || assignedNodeId === 'node_math' ? 'pcmb' : 'other');

  // Active Tab: Approvals is front and center to verify content before making public!
  const [activeTab, setActiveTab] = useState<'approvals' | 'creators' | 'workbench' | 'hierarchy' | 'students'>('approvals');

  // Filter scoped nodes in this branch
  const branchNodes = nodes.filter(n => n.path.split('.').includes(assignedNodeId) || n.id === assignedNodeId);
  const branchPending = branchNodes.filter(n => n.status === 'in_review');
  const branchNeedsRevision = branchNodes.filter(n => n.status === 'needs_revision');
  const branchPublished = branchNodes.filter(n => n.status === 'published');
  const branchDrafts = branchNodes.filter(n => n.status === 'draft');

  // Active Learners in system
  const learners = allUsers.filter(u => u.role === 'learner');

  // TRACK ONLY ITS CREATED CONTENT ADMINS:
  // Strictly filter Content Admins created by this Branch Admin (with fallback to creators assigned to this branch if createdBy not set)
  const myContentAdmins = allUsers.filter(u => 
    (u.role === 'content_creator' || u.role === 'content_admin') && 
    (u.createdBy === currentUser?.id || (!u.createdBy && (u.assignedNodeId === assignedNodeId || branchNodes.some(bn => bn.id === u.assignedNodeId))))
  );

  // ==========================================================
  // STATE: CREATE NEW CONTENT ADMIN MODAL
  // ==========================================================
  const [isCreateCreatorOpen, setIsCreateCreatorOpen] = useState<boolean>(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [creatorEmail, setCreatorEmail] = useState<string>('');
  const [creatorPassword, setCreatorPassword] = useState<string>('Creator@' + Math.floor(100 + Math.random() * 900));
  const [creatorSubtopicId, setCreatorSubtopicId] = useState<string>(assignedNodeId);
  const [creatorBranchName, setCreatorBranchName] = useState<string>(currentUser?.assignedBranchName || 'Branch Curriculum');
  const [creatorNotice, setCreatorNotice] = useState<string | null>(null);

  const handleCreateContentAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim() || !creatorEmail.trim() || !creatorPassword.trim()) return;

    const res = await createContentAdminByBranchAdmin({
      name: creatorName.trim(),
      email: creatorEmail.trim(),
      password: creatorPassword.trim(),
      assignedNodeId: creatorSubtopicId,
      assignedBranchName: creatorBranchName
    });

    if (res.success) {
      setCreatorNotice(`Content Admin "${creatorName}" created successfully!`);
      setCreatorName('');
      setCreatorEmail('');
      setCreatorPassword('Creator@' + Math.floor(100 + Math.random() * 900));
      setTimeout(() => {
        setCreatorNotice(null);
        setIsCreateCreatorOpen(false);
      }, 1500);
    } else {
      setCreatorNotice(`Error: ${res.message || 'Could not create Content Admin.'}`);
    }
  };

  // ==========================================================
  // STATE: EVALUATE CONTENT ADMIN PROGRESS MODAL
  // ==========================================================
  const [evaluatingCreator, setEvaluatingCreator] = useState<User | null>(null);
  const [evalScore, setEvalScore] = useState<number>(90);
  const [evalRating, setEvalRating] = useState<number>(5);
  const [evalRemarks, setEvalRemarks] = useState<string>('');
  const [evalNotice, setEvalNotice] = useState<string | null>(null);

  const handleOpenEvaluate = (creator: User) => {
    setEvaluatingCreator(creator);
    setEvalScore(creator.performanceScore ?? 90);
    setEvalRating(creator.evaluationRating ?? 5);
    setEvalRemarks(creator.evaluationRemarks || 'Demonstrates strong subject knowledge and consistent Devanagari translation quality.');
    setEvalNotice(null);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingCreator) return;

    const res = await evaluateContentAdmin(evaluatingCreator.id, {
      score: evalScore,
      rating: evalRating,
      remarks: evalRemarks.trim()
    });

    if (res.success) {
      setEvalNotice(`Progress review for ${evaluatingCreator.name} saved!`);
      setTimeout(() => {
        setEvalNotice(null);
        setEvaluatingCreator(null);
      }, 1200);
    }
  };

  // ==========================================================
  // STATE: REQUEST REVISION WITH REMARK MODAL
  // ==========================================================
  const [remarkingNode, setRemarkingNode] = useState<ContentNode | null>(null);
  const [remarkText, setRemarkText] = useState<string>('');
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const handleOpenRequestRevision = (node: ContentNode) => {
    setRemarkingNode(node);
    setRemarkText(node.branchAdminRemark || '');
  };

  const handleSubmitRevisionRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkingNode || !remarkText.trim()) return;

    requestRevisionWithRemark(remarkingNode.id, remarkText.trim());
    setApprovalNotice(`Revision remark sent to Content Admin for "${remarkingNode.translations.en?.title || remarkingNode.id}".`);
    setTimeout(() => {
      setApprovalNotice(null);
      setRemarkingNode(null);
    }, 1200);
  };

  const handleApproveNode = (node: ContentNode) => {
    approveAndMakePublic(node.id);
    setApprovalNotice(`Module "${node.translations.en?.title || node.id}" approved and made PUBLIC for all students!`);
    setTimeout(() => {
      setApprovalNotice(null);
    }, 1500);
  };

  // ==========================================================
  // STATE: INSPECT / PREVIEW CONTENT MODAL
  // ==========================================================
  const [previewingNode, setPreviewingNode] = useState<ContentNode | null>(null);

  // ==========================================================
  // STATE: EDIT CONTENT NODE MODAL
  // ==========================================================
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
  const [manualEditNodeType, setManualEditNodeType] = useState<boolean>(false);
  const [editNodeNotice, setEditNodeNotice] = useState<string | null>(null);

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
    setEditNodeNotice(null);
  };

  const handleSaveEditContentNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContentNode) return;

    const updatedNode: ContentNode = {
      ...editingContentNode,
      type: editNodeType,
      status: editNodeStatus,
      estimatedMinutes: editNodeMinutes,
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

  const handleDeleteContentNode = (node: ContentNode) => {
    const title = node.translations.en?.title || node.id;
    if (window.confirm(`Are you sure you want to delete "${title}" (${node.id}) and all of its sub-topics?`)) {
      deleteNode(node.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. BRANCH ADMIN SCOPE BANNER */}
      <div className={`p-6 rounded-3xl shadow-card border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white ${
        branchCategory === 'cs'
          ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-blue-900/40'
          : branchCategory === 'pcmb'
          ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-emerald-900/40'
          : 'bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border-purple-900/40'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            {branchCategory === 'cs' ? (
              <span className="text-blue-400 flex items-center gap-1.5"><Binary className="w-4 h-4" /> COMPUTER SCIENCE BRANCH</span>
            ) : branchCategory === 'pcmb' ? (
              <span className="text-emerald-400 flex items-center gap-1.5"><Atom className="w-4 h-4" /> PCMB SCIENCE BRANCH</span>
            ) : (
              <span className="text-purple-400 flex items-center gap-1.5"><Layers className="w-4 h-4" /> GENERAL DISCIPLINE BRANCH</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px]">
              BRANCH ADMIN CONSOLE
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            {currentUser?.assignedBranchName || assignedNode?.translations.en?.title || assignedNodeId}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300">Managed Root Scope:</span>
            <span className="px-3 py-0.5 rounded-full bg-white/10 border border-white/20 text-white font-bold text-xs">
              {assignedNodeId}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300">
              Responsible for Content Admin Governance & Public Approval
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreateCreatorOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create Content Admin</span>
          </button>
          <button
            onClick={() => onOpenCreateNode(assignedNodeId)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all text-white hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.addNewNode')}</span>
          </button>
        </div>
      </div>

      {/* Global Success / Alert Banner */}
      {approvalNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{approvalNotice}</span>
        </div>
      )}

      {/* 2. SCOPED BRANCH METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">My Content Admins</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            {myContentAdmins.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Created & tracked by you</div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm bg-amber-50/20">
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {branchPending.length}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Awaiting public release check</div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm bg-rose-50/20">
          <div className="text-xs text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Needs Revision</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {branchNeedsRevision.length}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Remarks sent to creator</div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Published (Live Public)</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {branchPublished.length}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Live for enrolled students</div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Branch Students</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {learners.filter(l => l.enrolledCourseIds?.includes(assignedNodeId)).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Enrolled learners</div>
        </div>
      </div>

      {/* 3. WORKSPACE TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'approvals' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>Content Approval Queue</span>
          {(branchPending.length + branchNeedsRevision.length) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black">
              {branchPending.length + branchNeedsRevision.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'creators' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 text-indigo-500" />
          <span>My Content Admins & Performance</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-black">
            {myContentAdmins.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('workbench')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'workbench' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {branchCategory === 'cs' ? (
            <>
              <Binary className="w-4 h-4 text-blue-500" />
              <span>CS Code Sandbox & Tests</span>
            </>
          ) : branchCategory === 'pcmb' ? (
            <>
              <Atom className="w-4 h-4 text-emerald-500" />
              <span>PCMB Science Studio</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 text-purple-500" />
              <span>Discipline Studio</span>
            </>
          )}
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'hierarchy' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Branch Hierarchy ({branchNodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'students' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Access ({learners.length})</span>
        </button>
      </div>

      {/* ==========================================================
          TAB 1: CONTENT APPROVAL QUEUE (CHECK BEFORE MAKING PUBLIC)
          ========================================================== */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Content Approval Queue</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                    Check Before Making Public
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect submitted lessons, formulas, Devanagari translations, and interactive canvas components. Approve to make public or add remarks for revision.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  {branchPending.length} submitted • {branchNeedsRevision.length} with remarks
                </span>
              </div>
            </div>

            {/* List of submissions */}
            {branchPending.length === 0 && branchNeedsRevision.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  All Submitted Content Reviewed!
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are no pending submissions awaiting approval. When your Content Admins finalize and approve content on their end, modules will appear here for your final verification.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...branchPending, ...branchNeedsRevision].map(node => {
                  const author = allUsers.find(u => u.id === node.createdBy || u.id === node.submittedBy);
                  const isNeedsRevision = node.status === 'needs_revision';
                  const titleEn = node.translations.en?.title || node.id;
                  const titleHi = node.translations.hi?.title;

                  return (
                    <div 
                      key={node.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isNeedsRevision 
                          ? 'border-rose-200/80 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10'
                          : 'border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              isNeedsRevision
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {isNeedsRevision ? '⚠️ Needs Revision (Remark Added)' : '⏳ Submitted for Branch Approval'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Type: {node.type}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {node.id}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {titleEn}
                            </h4>
                            {titleHi && (
                              <p className="text-xs font-devanagari font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                                🇮🇳 {titleHi}
                              </p>
                            )}
                          </div>

                          {/* Author Attribution */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                            <span className="font-semibold">Author:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {author?.name || node.createdBy}
                            </span>
                            {author?.email && (
                              <span className="font-mono text-[10px] text-slate-400">({author.email})</span>
                            )}
                          </div>

                          {/* Components Attached */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 font-bold">Included Parts:</span>
                            {node.translations.en?.body && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-medium">
                                📝 Theory Markdown
                              </span>
                            )}
                            {node.notes && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                                📑 3 Notes
                              </span>
                            )}
                            {node.simulationConfig && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                                ⚛️ Interactive Simulation
                              </span>
                            )}
                            {node.codingProblem && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                                💻 Code Sandbox
                              </span>
                            )}
                            {node.flowchart && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">
                                🔀 Decision Flowchart
                              </span>
                            )}
                            {node.quizQuestions && node.quizQuestions.length > 0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium">
                                ❓ Formative Quiz
                              </span>
                            )}
                            {node.audioExplanation && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-medium">
                                🎙️ Audio Narration
                              </span>
                            )}
                          </div>

                          {/* Current Branch Admin Remark if any */}
                          {node.branchAdminRemark && (
                            <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1 mt-2">
                              <div className="font-extrabold flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                <span>Your Current Remark to Content Admin:</span>
                              </div>
                              <p className="italic">"{node.branchAdminRemark}"</p>
                              {node.reviewedAt && (
                                <span className="text-[10px] font-mono text-amber-700/80 dark:text-amber-400">
                                  Sent: {new Date(node.reviewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Verification & Approval Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                          <button
                            onClick={() => setPreviewingNode(node)}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Eye className="w-4 h-4 text-indigo-500" />
                            <span>Check Display / Preview</span>
                          </button>

                          <button
                            onClick={() => handleApproveNode(node)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>✓ Approve & Make Public</span>
                          </button>

                          <button
                            onClick={() => handleOpenRequestRevision(node)}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>💬 Add Remark to Fix</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditContentNode(node)}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Quick Edit Properties</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 2: MY CONTENT ADMINS & PROGRESS EVALUATION
          ========================================================== */}
      {activeTab === 'creators' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>My Created Content Admins</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                    Tracking Scoped to Your Branch
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track only Content Admins created by you. Evaluate how good their pedagogical output is, inspect their approval rates, and assign quality scores & guidance remarks.
                </p>
              </div>

              <button
                onClick={() => setIsCreateCreatorOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create Another Content Admin</span>
              </button>
            </div>

            {myContentAdmins.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                  👥
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  No Content Admins Created Yet
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  As Branch Admin, you can create multiple Content Admins to author lessons and interactive modules for this branch.
                </p>
                <button
                  onClick={() => setIsCreateCreatorOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Create First Content Admin
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myContentAdmins.map(admin => {
                  const authoredNodes = branchNodes.filter(n => n.createdBy === admin.id);
                  const publishedNodes = authoredNodes.filter(n => n.status === 'published');
                  const pendingNodes = authoredNodes.filter(n => n.status === 'in_review');
                  const revisionNodes = authoredNodes.filter(n => n.status === 'needs_revision');
                  const totalModules = authoredNodes.length;
                  const approvalRate = totalModules > 0 ? Math.round((publishedNodes.length / totalModules) * 100) : 100;
                  const score = admin.performanceScore ?? 92;
                  const rating = admin.evaluationRating ?? 5;

                  return (
                    <div 
                      key={admin.id}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs"
                    >
                      {/* Admin Identity Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={admin.avatar} 
                            alt={admin.name} 
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/50 shrink-0" 
                          />
                          <div>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{admin.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{admin.email}</div>
                            <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                              Subtopic: {admin.assignedBranchName || admin.assignedNodeId || 'Branch Curriculum'}
                            </div>
                          </div>
                        </div>

                        {/* Performance Score Badge */}
                        <div className="text-right shrink-0">
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold font-mono inline-flex items-center gap-1 ${
                            score >= 90
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : score >= 75
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            <Award className="w-3.5 h-3.5" />
                            <span>{score}/100</span>
                          </div>
                          <div className="flex items-center justify-end text-amber-400 text-xs mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Productivity & Quality Metrics Bar */}
                      <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold">Total Authored</div>
                          <div className="font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">{totalModules}</div>
                        </div>
                        <div>
                          <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">Published</div>
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{publishedNodes.length}</div>
                        </div>
                        <div>
                          <div className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold">In Review</div>
                          <div className="font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">{pendingNodes.length}</div>
                        </div>
                        <div>
                          <div className="text-rose-600 dark:text-rose-400 text-[10px] font-semibold">Needs Fix</div>
                          <div className="font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-0.5">{revisionNodes.length}</div>
                        </div>
                      </div>

                      {/* Branch Admin's Evaluation Remarks */}
                      <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-xs space-y-1">
                        <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between text-[11px]">
                          <span>Your Progress Evaluation:</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Approval Rate: {approvalRate}%
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] italic">
                          "{admin.evaluationRemarks || 'Quality evaluation pending. Click button below to evaluate.'}"
                        </p>
                      </div>

                      {/* Evaluation Action Button */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          {admin.lastEvaluatedAt ? `Reviewed ${new Date(admin.lastEvaluatedAt).toLocaleDateString()}` : 'Awaiting review'}
                        </span>
                        <button
                          onClick={() => handleOpenEvaluate(admin)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Evaluate Progress & Quality</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 3: SPECIALIZED DISCIPLINE WORKBENCH
          ========================================================== */}
      {activeTab === 'workbench' && (
        branchCategory === 'cs' ? (
          <ComputerScienceWorkbench />
        ) : branchCategory === 'pcmb' ? (
          <PcmbWorkbench />
        ) : (
          <OtherBranchWorkbench />
        )
      )}

      {/* ==========================================================
          TAB 4: BRANCH HIERARCHY TREE
          ========================================================== */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Your Authorized Branch Subtree
              </h3>
              <p className="text-xs text-slate-400">
                All nodes inheriting permissions under {assignedNode?.translations.en?.title || assignedNodeId}
              </p>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/20">
              🔒 Scoped RBAC Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {branchNodes.map(n => {
              const hasHindi = !!n.translations.hi?.title;
              const relativeDepth = Math.max(0, n.depth - (assignedNode?.depth || 0));

              return (
                <div key={n.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden" style={{ paddingLeft: `${relativeDepth * 20}px` }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
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

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      n.status === 'published' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : n.status === 'in_review' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                        : n.status === 'needs_revision'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {n.status}
                    </span>

                    {n.status === 'in_review' && (
                      <button
                        onClick={() => handleApproveNode(n)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition-all"
                      >
                        Approve
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditContentNode(n)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center gap-1 transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => onOpenCreateNode(n.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all"
                    >
                      + Add Child
                    </button>

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

      {/* ==========================================================
          TAB 5: STUDENT ENROLLMENTS & BRANCH ACCESS MANAGEMENT
          ========================================================== */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Branch Student Access & Enrollment Management
              </h3>
              <p className="text-xs text-slate-400">
                Grant or revoke course access for students in {assignedNode?.translations.en?.title || assignedNodeId}
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">
              Target Track: {assignedNodeId}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Learner & Student ID</th>
                  <th className="p-3">Branch Access Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {learners.map(learner => {
                  const hasAccess = learner.enrolledCourseIds?.includes(assignedNodeId);

                  return (
                    <tr key={learner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 flex items-center gap-2.5">
                        <img src={learner.avatar} alt={learner.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{learner.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {learner.studentId ? `ID: ${learner.studentId}` : learner.email}
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {hasAccess ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Enrolled in {assignedNode?.translations.en?.title || assignedNodeId}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Not Enrolled
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => {
                            if (hasAccess) {
                              revokeCourseAccess(learner.id, assignedNodeId);
                            } else {
                              grantCourseAccess(learner.id, assignedNodeId);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all shadow-xs ${
                            hasAccess
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {hasAccess ? 'Revoke Access' : '+ Grant Access'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 1: CREATE CONTENT ADMIN
          ========================================================== */}
      {isCreateCreatorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Create New Content Admin
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Appoint an author dedicated to creating & formatting content in your branch
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateCreatorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {creatorNotice && (
              <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                creatorNotice.startsWith('Error')
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
              }`}>
                {creatorNotice.startsWith('Error') ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{creatorNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateContentAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Full Name (English & Devanagari) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra (रमेश चंद्र)"
                  value={creatorName}
                  onChange={e => setCreatorName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.creator@edunova.edu"
                  value={creatorEmail}
                  onChange={e => setCreatorEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreatorPassword('Creator@' + Math.floor(100 + Math.random() * 900))}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    🎲 Regenerate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={creatorPassword}
                  onChange={e => setCreatorPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Assigned Branch Scope / Subtopic
                </label>
                <select
                  value={creatorSubtopicId}
                  onChange={e => {
                    setCreatorSubtopicId(e.target.value);
                    const selected = branchNodes.find(bn => bn.id === e.target.value);
                    if (selected?.translations.en?.title) {
                      setCreatorBranchName(selected.translations.en.title);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={assignedNodeId}>Entire Branch ({assignedNode?.translations.en?.title || assignedNodeId})</option>
                  {branchNodes.filter(bn => bn.id !== assignedNodeId).map(bn => (
                    <option key={bn.id} value={bn.id}>
                      {bn.translations.en?.title || bn.id} ({bn.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  🔒 Role Isolation Guarantee:
                </div>
                <p>
                  This Content Admin will be strictly linked to your branch account (<span className="font-mono">{currentUser?.name}</span>). They will only author and display modules in this discipline. Their drafts will be routed to you for approval before becoming public.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCreatorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Content Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 2: EVALUATE CONTENT ADMIN PROGRESS & QUALITY
          ========================================================== */}
      {evaluatingCreator && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img 
                  src={evaluatingCreator.avatar} 
                  alt={evaluatingCreator.name} 
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/50" 
                />
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Evaluate Progress: {evaluatingCreator.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Assess how good this Content Admin is and assign pedagogical quality rating
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEvaluatingCreator(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {evalNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{evalNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Quality Score (0 - 100) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={evalScore}
                      onChange={e => setEvalScore(Number(e.target.value))}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 w-10 text-right">
                      {evalScore}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Star Rating (1 - 5) *
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEvalRating(star)}
                        className="p-1 text-base hover:scale-110 transition-transform"
                      >
                        <Star 
                          className={`w-5 h-5 ${star <= evalRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} 
                        />
                      </button>
                    ))}
                    <span className="font-mono text-xs text-slate-400 ml-1">({evalRating}/5)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Branch Admin Progress Evaluation & Remarks *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Great Devanagari technical terms and interactive projectile challenge configurations. Ensure formative quiz questions include detailed explanations."
                  value={evalRemarks}
                  onChange={e => setEvalRemarks(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingCreator(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Evaluation & Send Feedback</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 3: REQUEST REVISION & ADD REMARK
          ========================================================== */}
      {remarkingNode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Request Changes & Add Remark to Fix
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Content will be sent back to Content Admin to fix before making it public
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRemarkingNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="text-slate-400 text-[10px] font-bold">Target Module:</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {remarkingNode.translations.en?.title || remarkingNode.id}
              </div>
              {remarkingNode.translations.hi?.title && (
                <div className="text-slate-500 font-devanagari text-xs mt-0.5">
                  🇮🇳 {remarkingNode.translations.hi.title}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitRevisionRemark} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Specific Remarks & Instructions to Fix *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please correct the formula in section 2; verify the Hindi Devanagari translation for kinetic energy; and add 2 automated test cases for the Python starter code."
                  value={remarkText}
                  onChange={e => setRemarkText(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Workflow Notice:</span>
                </div>
                <p>
                  The status of this module will be changed to <span className="font-bold">"Needs Revision"</span>. The Content Admin will receive your remarks, update the content, and re-submit for your approval.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRemarkingNode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Remark & Request Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 4: INSPECT & PREVIEW CONTENT BEFORE PUBLIC RELEASE
          ========================================================== */}
      {previewingNode && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#0F172A] z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Content Verification Preview
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Node ID: {previewingNode.id} • Path: {previewingNode.path}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* English & Hindi Title Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">🇬🇧 English Title</span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {previewingNode.translations.en?.title || 'No Title'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {previewingNode.translations.en?.description || 'No description provided.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1 font-devanagari">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">🇮🇳 हिन्दी देवनागरी शीर्षक</span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {previewingNode.translations.hi?.title || '(हिन्दी शीर्षक अनुपलब्ध)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {previewingNode.translations.hi?.description || '(विवरण अनुपलब्ध)'}
                </p>
              </div>
            </div>

            {/* Theory Body Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase font-mono">
                Lesson Markdown Theory (Preview)
              </span>
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
                <MarkdownPreview content={previewingNode.translations.en?.body || '*No theory body written.*'} />
              </div>
            </div>

            {/* Interactive Components Summary */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/60 space-y-2 text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">
                Interactive Components Configured:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold">Physics Simulation:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {previewingNode.simulationConfig ? `✓ Type: ${previewingNode.simulationConfig.type}` : 'None'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold">Coding Sandbox:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {previewingNode.codingProblem ? `✓ ${previewingNode.codingProblem.language} (${previewingNode.codingProblem.testCases?.length || 0} tests)` : 'None'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold">Formative Quiz:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {previewingNode.quizQuestions ? `✓ ${previewingNode.quizQuestions.length} Questions` : 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions at bottom of preview */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewingNode(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenRequestRevision(previewingNode);
                    setPreviewingNode(null);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleApproveNode(previewingNode);
                    setPreviewingNode(null);
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>✓ Approve & Make Public</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 5: EDIT CONTENT NODE PROPERTIES
          ========================================================== */}
      {editingContentNode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Edit Node: {editingContentNode.translations.en?.title || editingContentNode.id}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {editingContentNode.id} • Path: {editingContentNode.path}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
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
                    <option value="needs_revision">Needs Revision (संशोधन आवश्यक)</option>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                    🇬🇧 English Content
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
                      Description
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
                      Detailed Theory (Markdown)
                    </label>
                    <textarea
                      rows={4}
                      value={editNodeBodyEn}
                      onChange={e => setEditNodeBodyEn(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                    🇮🇳 हिंदी सामग्री (Devanagari Translation)
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      शीर्षक (Hindi Title)
                    </label>
                    <input
                      type="text"
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
                      value={editNodeBodyHi}
                      onChange={e => setEditNodeBodyHi(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-devanagari font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

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
    </div>
  );
};
