import React, { createContext, useContext, useState, useEffect } from 'react';
import { ContentNode, NodeStatus, AuditLogEntry } from '../types';
import { initialNodes } from '../data/initialNodes';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface ContentContextType {
  nodes: ContentNode[];
  auditLogs: AuditLogEntry[];
  getNodeById: (id: string) => ContentNode | undefined;
  getChildNodes: (parentId: string | null) => ContentNode[];
  getDescendantNodes: (rootId: string) => ContentNode[];
  getBreadcrumbs: (nodeId: string) => ContentNode[];
  addNode: (node: Omit<ContentNode, 'path' | 'depth' | 'createdAt' | 'updatedAt'>) => ContentNode;
  updateNode: (node: ContentNode) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  approveAndMakePublic: (nodeId: string) => void;
  requestRevisionWithRemark: (nodeId: string, remark: string) => void;
  resubmitForBranchApproval: (nodeId: string) => void;
  getPendingReviewNodes: () => ContentNode[];
  getNeedsRevisionNodes: () => ContentNode[];
  getMissingTranslationNodes: () => ContentNode[];
  resetToInitialData: () => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [nodes, setNodes] = useState<ContentNode[]>(() => {
    const deletedNodeIdsRaw = localStorage.getItem('veyra_deleted_node_ids');
    const deletedNodeIds: Set<string> = new Set(deletedNodeIdsRaw ? JSON.parse(deletedNodeIdsRaw) : []);

    const saved = localStorage.getItem('veyra_nodes') || localStorage.getItem('edunova_nodes');
    const baseNodes = saved ? JSON.parse(saved) : initialNodes;
    return baseNodes.filter((n: ContentNode) => !deletedNodeIds.has(n.id) && !n.path.split('.').some(id => deletedNodeIds.has(id)));
  });

  // Synchronize with backend /api/content on mount & user change
  useEffect(() => {
    async function loadContentFromBackend() {
      try {
        const res = await api.content.getAll({ limit: 300 });
        if (res && res.success && Array.isArray(res.nodes) && res.nodes.length > 0) {
          const deletedNodeIdsRaw = localStorage.getItem('veyra_deleted_node_ids');
          const deletedNodeIds: Set<string> = new Set(deletedNodeIdsRaw ? JSON.parse(deletedNodeIdsRaw) : []);
          const activeBackendNodes = res.nodes.filter((n: ContentNode) => 
            !deletedNodeIds.has(n.id) && !n.path.split('.').some(id => deletedNodeIds.has(id))
          );
          if (activeBackendNodes.length > 0) {
            setNodes(activeBackendNodes);
            localStorage.setItem('veyra_nodes', JSON.stringify(activeBackendNodes));
          }
        }
      } catch (err: any) {
        console.warn('Backend content load notice (falling back to cached hierarchy):', err?.message);
      }
    }
    loadContentFromBackend();
  }, [currentUser]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('veyra_audit_logs') || localStorage.getItem('edunova_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log_init',
        timestamp: new Date().toISOString(),
        userId: 'user_super_admin',
        userName: 'Dr. Rajesh Sharma',
        userRole: 'super_admin',
        action: 'SYSTEM_INITIALIZED',
        details: 'Initial content hierarchy tree seeded with physics simulation and video checkpoints.'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('veyra_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('veyra_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (action: string, nodeId?: string, details?: string) => {
    const newLog: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system_guest',
      userName: currentUser?.name || 'Guest User',
      userRole: currentUser?.role || 'learner',
      action,
      nodeId,
      details: details || `Performed ${action} on ${nodeId || 'system'}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const getNodeById = (id: string): ContentNode | undefined => {
    return nodes.find(n => n.id === id);
  };

  const getChildNodes = (parentId: string | null): ContentNode[] => {
    return nodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  };

  const getDescendantNodes = (rootId: string): ContentNode[] => {
    return nodes.filter(n => n.path.split('.').includes(rootId));
  };

  const getBreadcrumbs = (nodeId: string): ContentNode[] => {
    const target = getNodeById(nodeId);
    if (!target) return [];

    const pathIds = target.path.split('.');
    const crumbs: ContentNode[] = [];
    for (const pid of pathIds) {
      const found = getNodeById(pid);
      if (found) crumbs.push(found);
    }
    return crumbs;
  };

  const addNode = (nodeData: Omit<ContentNode, 'path' | 'depth' | 'createdAt' | 'updatedAt'>): ContentNode => {
    let parentPath = '';
    let depth = 0;

    if (nodeData.parentId) {
      const parent = getNodeById(nodeData.parentId);
      if (parent) {
        parentPath = parent.path;
        depth = parent.depth + 1;
      }
    }

    const path = parentPath ? `${parentPath}.${nodeData.id}` : nodeData.id;
    const now = new Date().toISOString();

    const newNode: ContentNode = {
      ...nodeData,
      createdBy: nodeData.createdBy || currentUser?.id || 'admin_creator',
      path,
      depth,
      updatedAt: now,
    };

    setNodes(prev => [...prev.filter(n => n.id !== newNode.id), newNode]);
    addAuditLog('CREATE_NODE', newNode.id, `Created ${newNode.type}: ${newNode.translations.en?.title || newNode.id}`);

    // Persist to backend MongoDB
    api.content.create(newNode).catch(err => {
      console.warn('Backend createNode notice (saved locally):', err?.message);
    });

    return newNode;
  };

  const updateNode = (updatedNode: ContentNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? { ...updatedNode, updatedAt: new Date().toISOString() } : n));
    addAuditLog('UPDATE_NODE', updatedNode.id, `Updated ${updatedNode.type}: ${updatedNode.translations.en?.title || updatedNode.id}`);

    // Persist to backend MongoDB
    api.content.update(updatedNode.id, updatedNode).catch(err => {
      console.warn('Backend updateNode notice (saved locally):', err?.message);
    });
  };

  const deleteNode = (nodeId: string) => {
    // Delete target and all descendants matching materialized path
    const target = nodes.find(n => n.id === nodeId);
    const affectedIds = nodes
      .filter(n => n.path.split('.').includes(nodeId) || n.id === nodeId)
      .map(n => n.id);

    // Save to deleted set in localStorage so they never reappear on refresh
    const deletedNodeIdsRaw = localStorage.getItem('veyra_deleted_node_ids');
    const deletedArr: string[] = deletedNodeIdsRaw ? JSON.parse(deletedNodeIdsRaw) : [];
    deletedArr.push(...affectedIds);
    localStorage.setItem('veyra_deleted_node_ids', JSON.stringify(Array.from(new Set(deletedArr))));

    const filtered = nodes.filter(n => !n.path.split('.').includes(nodeId) && n.id !== nodeId);
    setNodes(filtered);
    localStorage.setItem('veyra_nodes', JSON.stringify(filtered));

    addAuditLog('DELETE_NODE', nodeId, `Deleted node and its subtree: ${nodeId} (${affectedIds.length} total nodes)`);

    // Cascade delete on backend MongoDB
    api.content.delete(nodeId).catch(err => {
      console.warn('Backend deleteNode notice (saved locally):', err?.message);
    });
  };

  const updateNodeStatus = (nodeId: string, status: NodeStatus) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, status, updatedAt: new Date().toISOString() };
      }
      return n;
    }));
    addAuditLog('UPDATE_STATUS', nodeId, `Changed status to ${status}`);

    // Persist status change to backend MongoDB
    api.content.update(nodeId, { status }).catch(err => {
      console.warn('Backend updateNodeStatus notice:', err?.message);
    });
  };

  const approveAndMakePublic = (nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    const now = new Date().toISOString();
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          status: 'published' as NodeStatus,
          reviewedBy: currentUser?.name || 'Branch Admin',
          reviewedAt: now,
          updatedAt: now,
          branchAdminRemark: undefined
        };
      }
      return n;
    }));

    addAuditLog('APPROVE_PUBLIC', nodeId, `Branch Admin approved & made public: ${target?.translations.en?.title || nodeId}`);

    api.content.update(nodeId, {
      status: 'published',
      reviewedBy: currentUser?.name || 'Branch Admin',
      reviewedAt: now,
      branchAdminRemark: ''
    }).catch(err => {
      console.warn('Backend approveNode notice:', err?.message);
    });
  };

  const requestRevisionWithRemark = (nodeId: string, remark: string) => {
    const target = nodes.find(n => n.id === nodeId);
    const now = new Date().toISOString();
    const newRemark = {
      id: `rem_rev_${Date.now()}`,
      remark: remark.trim(),
      author: currentUser?.name || 'Branch Admin',
      timestamp: now
    };

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const existingRemarks = n.reviewRemarks || [];
        return {
          ...n,
          status: 'needs_revision' as NodeStatus,
          branchAdminRemark: remark.trim(),
          reviewRemarks: [newRemark, ...existingRemarks],
          reviewedBy: currentUser?.name || 'Branch Admin',
          reviewedAt: now,
          updatedAt: now
        };
      }
      return n;
    }));

    addAuditLog('REQUEST_REVISION', nodeId, `Branch Admin requested revision: "${remark.trim()}" on ${target?.translations.en?.title || nodeId}`);

    api.content.update(nodeId, {
      status: 'needs_revision',
      branchAdminRemark: remark.trim(),
      reviewedBy: currentUser?.name || 'Branch Admin',
      reviewedAt: now
    }).catch(err => {
      console.warn('Backend requestRevision notice:', err?.message);
    });
  };

  const resubmitForBranchApproval = (nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    const now = new Date().toISOString();

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          status: 'in_review' as NodeStatus,
          submittedBy: currentUser?.name || 'Content Admin',
          updatedAt: now
        };
      }
      return n;
    }));

    addAuditLog('RESUBMIT_APPROVAL', nodeId, `Content Admin fixed & resubmitted for branch approval: ${target?.translations.en?.title || nodeId}`);

    api.content.update(nodeId, {
      status: 'in_review',
      submittedBy: currentUser?.name || 'Content Admin'
    }).catch(err => {
      console.warn('Backend resubmitNode notice:', err?.message);
    });
  };

  const getPendingReviewNodes = (): ContentNode[] => {
    return nodes.filter(n => n.status === 'in_review');
  };

  const getNeedsRevisionNodes = (): ContentNode[] => {
    return nodes.filter(n => n.status === 'needs_revision');
  };

  const getMissingTranslationNodes = (): ContentNode[] => {
    return nodes.filter(n => !n.translations.hi || !n.translations.hi.title);
  };

  const resetToInitialData = () => {
    setNodes(initialNodes);
    localStorage.removeItem('edunova_nodes');
    addAuditLog('RESET_DATA', undefined, 'Reset content hierarchy to factory defaults');
  };

  return (
    <ContentContext.Provider
      value={{
        nodes,
        auditLogs,
        getNodeById,
        getChildNodes,
        getDescendantNodes,
        getBreadcrumbs,
        addNode,
        updateNode,
        deleteNode,
        updateNodeStatus,
        approveAndMakePublic,
        requestRevisionWithRemark,
        resubmitForBranchApproval,
        getPendingReviewNodes,
        getNeedsRevisionNodes,
        getMissingTranslationNodes,
        resetToInitialData,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used within ContentProvider');
  return context;
};
