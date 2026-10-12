import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useContent } from '../../context/ContentContext';
import { useLanguage } from '../../context/LanguageContext';
import { ContentNode, NodeStatus } from '../../types';
import { ContentCreatorWorkspace } from '../admin/ContentCreatorWorkspace';
import { 
  Sparkles, PlusCircle, TrendingUp, Search, 
  Atom, Code, GitFork, Volume2, HelpCircle, 
  Image as ImageIcon, Eye, Edit3, Trash2, 
  CheckCircle2, ArrowRight, Lock, FileText, 
  ChevronLeft, LayoutDashboard, Layers, Star,
  AlertCircle, MessageSquare, Send, Check, Clock
} from 'lucide-react';

interface ContentPageProps {
  onNavigate: (page: string) => void;
  onOpenClassroom: (node: ContentNode) => void;
}

export const ContentPage: React.FC<ContentPageProps> = ({ onNavigate, onOpenClassroom }) => {
  const { currentUser, allUsers } = useAuth();
  const { nodes, updateNodeStatus, deleteNode, resubmitForBranchApproval } = useContent();
  const { language } = useLanguage();

  // Access check: only authorized admins/creators (super_admin, branch_admin, content_creator, content_admin, reviewer)
  const isAuthorized = !!currentUser && currentUser.role !== 'learner' && currentUser.role !== 'parent';

  // State: 'dashboard' (portfolio & tracking) vs 'editor' (ContentCreatorWorkspace)
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit') || params.get('create') || params.get('parentId')) {
        return 'editor';
      }
    }
    return 'dashboard';
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'in_review' | 'needs_revision' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Editing node state
  const [editingNode, setEditingNode] = useState<ContentNode | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit') || params.get('id');
      if (editId) {
        return nodes.find(n => n.id === editId) || null;
      }
    }
    return null;
  });

  const [initialParentId, setInitialParentId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('parentId') || undefined;
    }
    return undefined;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit') || params.get('id');
      const pId = params.get('parentId');
      const isCreate = params.get('create');
      if (editId) {
        const found = nodes.find(n => n.id === editId);
        if (found) {
          setEditingNode(found);
          setViewMode('editor');
        }
      } else if (isCreate || pId) {
        setEditingNode(null);
        if (pId) setInitialParentId(pId);
        setViewMode('editor');
      }
    }
  }, [nodes]);

  if (!isAuthorized || !currentUser) {
    return (
      <div className="py-20 text-center space-y-5 max-w-lg mx-auto px-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-3xl shadow-sm">
          <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            {language === 'hi' ? 'केवल अधिकृत व्यवस्थापक' : 'Authorized Creators Only'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {language === 'hi' ? 'सामग्री निर्माण स्टूडियो' : 'Content Creation Studio'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === 'hi'
              ? 'यह पृष्ठ केवल सामग्री निर्माताओं और व्यवस्थापकों के लिए उपलब्ध है। शिक्षार्थियों के लिए सभी शोध आलेख व ब्लॉग, ब्लॉग अनुभाग में उपलब्ध हैं।'
              : 'This workspace is exclusively for content administrators and creators to author learning modules. Learners can explore Super Admin blogs and simulations.'}
          </p>
        </div>
        <div>
          <button
            onClick={() => onNavigate('blogs')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
          >
            <span>{language === 'hi' ? 'आलेख व ब्लॉग पढ़ें' : 'Read Blogs & Articles'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Supervising Branch Admin lookup
  const branchOverseer = allUsers.find(u => u.id === currentUser.createdBy) ||
    allUsers.find(u => u.role === 'branch_admin' && (u.assignedNodeId === currentUser.assignedNodeId || u.branchCategory === currentUser.branchCategory));

  // Data isolation: Filter content authored by this creator (Super Admin sees all)
  const myCreatedNodes = nodes.filter(n => {
    if (currentUser.role === 'super_admin') return true;
    return n.createdBy === currentUser.id || (currentUser.assignedNodeId && n.path.split('.').includes(currentUser.assignedNodeId));
  });

  const filteredNodes = myCreatedNodes.filter(n => {
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleEn = n.translations.en?.title?.toLowerCase() || '';
      const titleHi = n.translations.hi?.title?.toLowerCase() || '';
      const id = n.id.toLowerCase();
      if (!titleEn.includes(q) && !titleHi.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  // Tracking metrics
  const totalAuthored = myCreatedNodes.length;
  const publishedCount = myCreatedNodes.filter(n => n.status === 'published').length;
  const inReviewCount = myCreatedNodes.filter(n => n.status === 'in_review').length;
  const needsRevisionCount = myCreatedNodes.filter(n => n.status === 'needs_revision').length;
  const draftCount = myCreatedNodes.filter(n => n.status === 'draft').length;
  const withSimulationCount = myCreatedNodes.filter(n => !!n.simulationConfig).length;
  const withCodeCount = myCreatedNodes.filter(n => !!n.codingProblem).length;

  // Nodes with active revision remarks from Branch Admin
  const revisionAlertNodes = myCreatedNodes.filter(n => n.status === 'needs_revision' && !!n.branchAdminRemark);

  const handleStartCreate = (parentId?: string) => {
    setEditingNode(null);
    setInitialParentId(parentId);
    setViewMode('editor');
    if (typeof window !== 'undefined') {
      const url = parentId ? `/content?create=true&parentId=${encodeURIComponent(parentId)}` : '/content?create=true';
      window.history.pushState(null, '', url);
    }
  };

  const handleStartEdit = (node: ContentNode) => {
    setEditingNode(node);
    setViewMode('editor');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/content?edit=${encodeURIComponent(node.id)}`);
    }
  };

  const handleReturnToDashboard = () => {
    setViewMode('dashboard');
    setEditingNode(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/content');
    }
  };

  const handleSubmitForBranchApproval = (node: ContentNode) => {
    resubmitForBranchApproval(node.id);
    setActionNotice(`Module "${node.translations.en?.title || node.id}" submitted to Branch Admin for approval!`);
    setTimeout(() => {
      setActionNotice(null);
    }, 2000);
  };

  // If in Editor view, render the pure Content Creator Workspace (A4 Sheet + Pedagogical Toolbox)
  if (viewMode === 'editor') {
    return (
      <div className="space-y-4 animate-in fade-in">
        {/* Navigation bar to return to Portfolio */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800 font-devanagari">
          <button
            type="button"
            onClick={handleReturnToDashboard}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{language === 'hi' ? '← मेरे पोर्टफोलियो पर वापस जाएं' : '← Back to My Portfolio'}</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            {editingNode
              ? (language === 'hi'
                ? `संपादन: ${editingNode.translations[language]?.title || editingNode.translations.en?.title || editingNode.id}`
                : `Editing: ${editingNode.translations.en?.title || editingNode.id}`)
              : (language === 'hi' ? 'नया विषय मॉड्यूल बनाया जा रहा है' : 'Creating New Topic Module')}
          </span>
        </div>

        {/* If editing node has branchAdminRemark, show warning banner */}
        {editingNode && editingNode.status === 'needs_revision' && editingNode.branchAdminRemark && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-extrabold text-xs">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>Branch Admin Remark — Fix Before Resubmitting:</span>
            </div>
            <p className="text-xs italic pl-6 font-medium">"{editingNode.branchAdminRemark}"</p>
          </div>
        )}

        <div className="w-full -mx-4 sm:-mx-6 lg:-mx-8 -my-2 sm:-my-4">
          <ContentCreatorWorkspace
            initialParentId={initialParentId}
            initialNode={editingNode || undefined}
            onSaved={(savedNode) => {
              onOpenClassroom(savedNode);
            }}
            onClose={handleReturnToDashboard}
          />
        </div>
      </div>
    );
  }

  // Otherwise, render the Content Creation & Tracking Dashboard
  return (
    <div className="space-y-6 py-4 animate-in fade-in">
      {/* 1. CONTENT ADMIN PROFILE & SUPERVISION BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-devanagari">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {currentUser.role === 'super_admin' ? 'SUPER ADMIN' : 'CONTENT ADMIN'}
              </span>
              {currentUser.performanceScore !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  <span>Quality Score: {currentUser.performanceScore}/100</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {currentUser.email}
              {currentUser.assignedBranchName && ` • Scope: ${currentUser.assignedBranchName}`}
            </p>

            {branchOverseer && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Supervising Branch Admin:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {branchOverseer.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({branchOverseer.assignedBranchName || 'Branch Admin'})</span>
              </div>
            )}
          </div>
        </div>

        {/* Studio Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleStartCreate()}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Topic Module</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('classroom')}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Classroom View</span>
          </button>
        </div>
      </div>

      {/* Global Action Notice */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. REVISION REQUIRED ALERT SECTION (HIGH PRIORITY) */}
      {revisionAlertNodes.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Action Required: Branch Admin Requested Revisions on {revisionAlertNodes.length} Module(s)</span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300">
            Before making these modules public, your Branch Admin inspected the content and provided specific remarks. Fix the issues below and re-submit for approval.
          </p>

          <div className="space-y-2 pt-1">
            {revisionAlertNodes.map(node => (
              <div 
                key={node.id} 
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {node.translations.en?.title || node.id}
                  </div>
                  <div className="text-amber-700 dark:text-amber-400 font-medium text-[11px] mt-0.5">
                    💬 Remark from Branch Admin: "{node.branchAdminRemark}"
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartEdit(node)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit & Fix</span>
                  </button>
                  <button
                    onClick={() => handleSubmitForBranchApproval(node)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Fix Done - Re-submit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. METRICS KPI GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-devanagari">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Authored</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalAuthored}</div>
          <p className="text-[10px] text-slate-500">Modules in your workspace</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Drafts</span>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">{draftCount}</div>
          <p className="text-[10px] text-slate-500">Authoring in progress</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-1 bg-amber-50/20">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">In Review</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{inReviewCount}</div>
          <p className="text-[10px] text-slate-500">Waiting for branch approval</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-1 bg-rose-50/20">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Needs Revision</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{needsRevisionCount}</div>
          <p className="text-[10px] text-slate-500">Remarks to address</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-1 bg-emerald-50/20">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Approved & Public</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{publishedCount}</div>
          <p className="text-[10px] text-slate-500">Live for all students</p>
        </div>
      </div>

      {/* 4. CONTENT PORTFOLIO & TRACKING */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 font-devanagari">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>My Authored Content Portfolio</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Author lessons, verify visual display accuracy, and submit to your Branch Admin for public release.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold font-devanagari overflow-x-auto">
            {[
              { id: 'all', label: `All (${totalAuthored})` },
              { id: 'draft', label: `Drafts (${draftCount})` },
              { id: 'in_review', label: `In Review (${inReviewCount})` },
              { id: 'needs_revision', label: `Needs Fix (${needsRevisionCount})` },
              { id: 'published', label: `Public (${publishedCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  filterStatus === tab.id
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative font-devanagari">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your authored topics by title, ID, or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Authored Content Nodes Grid */}
        {filteredNodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNodes.map(node => {
              const displayTitle = node.translations[language]?.title || node.translations.en?.title || node.id;
              const displayDesc = node.translations[language]?.description || node.translations.en?.description || '';
              const isNeedsRevision = node.status === 'needs_revision';
              const isInReview = node.status === 'in_review';
              const isPublished = node.status === 'published';
              const isDraft = node.status === 'draft';

              return (
                <div
                  key={node.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 shadow-xs hover:shadow-md flex flex-col justify-between ${
                    isNeedsRevision
                      ? 'border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                      : isInReview
                      ? 'border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isPublished
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isInReview
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : isNeedsRevision
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {isPublished ? '✓ Approved & Public' : isInReview ? '⏳ In Review (Awaiting Branch)' : isNeedsRevision ? '⚠️ Needs Revision' : 'Draft'}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400">
                        {node.id}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug font-devanagari">
                        {displayTitle}
                      </h3>
                      {displayDesc && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed font-devanagari">
                          {displayDesc}
                        </p>
                      )}
                    </div>

                    {/* Branch Admin Remark if revision requested */}
                    {isNeedsRevision && node.branchAdminRemark && (
                      <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                        <div className="font-extrabold flex items-center gap-1 text-[11px]">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                          <span>Branch Admin Remark:</span>
                        </div>
                        <p className="italic">"{node.branchAdminRemark}"</p>
                      </div>
                    )}

                    {/* Attached Components Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 font-devanagari">
                      {node.simulationConfig && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                          <Atom className="w-3 h-3" />
                          <span>Sim Lab</span>
                        </span>
                      )}
                      {node.codingProblem && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <Code className="w-3 h-3" />
                          <span>Code</span>
                        </span>
                      )}
                      {node.flowchart?.mermaidCode && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          <span>Flowchart</span>
                        </span>
                      )}
                      {node.audioExplanation && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />
                          <span>Audio</span>
                        </span>
                      )}
                      {node.quizQuestions && node.quizQuestions.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          <span>Quiz ({node.quizQuestions.length})</span>
                        </span>
                      )}
                      {node.images && node.images.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>Images ({node.images.length})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-3 font-devanagari">
                    <div className="flex items-center gap-1.5">
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => handleSubmitForBranchApproval(node)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1 shadow-xs"
                          title="Submit to Branch Admin to check and approve before making public"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit to Branch Admin</span>
                        </button>
                      )}

                      {isNeedsRevision && (
                        <button
                          type="button"
                          onClick={() => handleSubmitForBranchApproval(node)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 shadow-xs"
                          title="Fix completed: Resubmit to Branch Admin for approval"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Fix Done - Resubmit</span>
                        </button>
                      )}

                      {isInReview && (
                        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Branch Review</span>
                        </span>
                      )}

                      {isPublished && (
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Live & Public</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Preview in Classroom */}
                      <button
                        type="button"
                        onClick={() => onOpenClassroom(node)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                        title="Open topic in Classroom view"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Classroom</span>
                      </button>

                      {/* Edit in Studio */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(node)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-colors flex items-center gap-1 shadow-xs"
                        title="Edit in full Content Studio"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = `Delete module "${displayTitle}"?`;
                          if (window.confirm(confirmMsg)) {
                            deleteNode(node.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 font-devanagari">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
              📂
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No topics matching this filter
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a new module to start authoring interactive lessons with physics simulations and code exercises.
            </p>
            <button
              onClick={() => handleStartCreate()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs"
            >
              + Create First Topic Module
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
