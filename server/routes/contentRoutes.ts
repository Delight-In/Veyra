import { Router, Request, Response } from 'express';
import { ContentNodeModel, IContentNodeDoc } from '../models/ContentNode';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Optional Auth Middleware: attaches req.user if a valid token is provided,
 * but allows unauthenticated visitors to view published educational content.
 */
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
const JWT_SECRET = process.env.JWT_SECRET || 'edunova_enterprise_secret_jwt_key_2026_secure_auth_9988';

const optionalAuthenticate = async (req: AuthenticatedRequest, _res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    if (user && user.isEmailVerified) {
      req.user = user;
    }
  } catch {
    // Proceed as unauthenticated
  }
  next();
};

/**
 * GET /api/content
 * Highly scalable retrieval of course nodes with data isolation.
 * - Public / Learners: receives only 'published' content.
 * - Created Admins: receives 'published' content + their own created nodes (drafts/in_review).
 * - Super Admin: receives all content across all statuses.
 */
router.get('/', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, type, parentId, search, limit = '200', page = '1' } = req.query;
    const query: any = {};

    const user = req.user;
    if (!user || user.role === 'learner') {
      // Learners & unauthenticated visitors ONLY receive published content
      query.status = 'published';
    } else if (user.role === 'super_admin') {
      // Super Admin can filter by any status if requested
      if (status) query.status = status;
    } else if (user.role === 'branch_admin') {
      // Branch Admin: sees all published content AND all content in their branch subtree
      const branchId = user.assignedNodeId || 'node_science';
      const branchRegex = new RegExp(`(^|\\.)${branchId}(\\.|$)`);
      if (status) {
        query.status = status;
        if (status !== 'published') {
          query.$or = [{ path: branchRegex }, { createdBy: user.id }];
        }
      } else {
        query.$or = [
          { status: 'published' },
          { path: branchRegex },
          { createdBy: user.id }
        ];
      }
    } else {
      // Content Admins / Creators: see all published content OR content authored by themselves
      if (status) {
        query.status = status;
        if (status !== 'published') {
          query.createdBy = user.id;
        }
      } else {
        query.$or = [
          { status: 'published' },
          { createdBy: user.id }
        ];
      }
    }

    if (type) query.type = type;
    if (parentId !== undefined) query.parentId = parentId === 'null' ? null : parentId;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      query.$or = [
        { 'translations.en.title': { $regex: q, $options: 'i' } },
        { 'translations.hi.title': { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(300, Math.max(1, parseInt(limit as string, 10) || 200));
    const skip = (pageNum - 1) * limitNum;

    const [total, nodes] = await Promise.all([
      ContentNodeModel.countDocuments(query),
      ContentNodeModel.find(query)
        .sort({ depth: 1, order: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      nodes
    });
  } catch (err: any) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve content nodes: ' + err.message 
    });
  }
});

/**
 * GET /api/content/:id
 * Fetches single node by ID with permission check.
 */
router.get('/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const node = await ContentNodeModel.findOne({ id: req.params.id }).lean();
    if (!node) {
      return res.status(404).json({ success: false, message: 'Content node not found.' });
    }

    // Security Gate: drafts & in_review nodes can only be viewed by author, branch admin, or super admin
    if (node.status !== 'published') {
      const user = req.user;
      const isAuthor = user && node.createdBy === user.id;
      const isSuper = user && user.role === 'super_admin';
      const isBranchAdmin = user && user.role === 'branch_admin' && (
        !user.assignedNodeId || node.path.split('.').includes(user.assignedNodeId)
      );

      if (!user || (!isAuthor && !isSuper && !isBranchAdmin)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access restricted: Node is in draft or pending review.' 
        });
      }
    }

    return res.status(200).json({ success: true, node });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error retrieving node: ' + err.message });
  }
});

/**
 * POST /api/content
 * Creates a new content node.
 * Strictly restricted to authenticated administrators.
 */
router.post('/', authenticateToken, requireRole('super_admin', 'branch_admin', 'content_creator', 'reviewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      id, parentId = null, type = 'lesson', order = 10,
      status = 'published', targetAgeBand = 'all', estimatedMinutes = 15,
      translations, notes, simulationConfig, codingProblem, flowchart,
      audioExplanation, images, quizQuestions, flashcards
    } = req.body;

    if (!translations || !translations.en || !translations.en.title) {
      return res.status(400).json({ success: false, message: 'English translation with title is required.' });
    }

    const finalId = id && typeof id === 'string' && id.trim()
      ? id.trim().toLowerCase().replace(/\s+/g, '_')
      : `node_${Date.now()}`;

    // Verify uniqueness
    const existing = await ContentNodeModel.findOne({ id: finalId });
    if (existing) {
      return res.status(409).json({ success: false, message: `Node with ID "${finalId}" already exists.` });
    }

    // Materialized path calculation
    let path = finalId;
    let depth = 0;
    if (parentId) {
      const parent = await ContentNodeModel.findOne({ id: parentId }).lean();
      if (parent) {
        path = `${parent.path}.${finalId}`;
        depth = parent.depth + 1;
      }
    }

    const createdBy = req.user?.id || 'admin_creator';

    const newNode = await ContentNodeModel.create({
      id: finalId,
      parentId: parentId || null,
      path,
      depth,
      type,
      order,
      status,
      targetAgeBand,
      estimatedMinutes,
      translations,
      notes,
      simulationConfig,
      codingProblem,
      flowchart,
      audioExplanation,
      images,
      quizQuestions,
      flashcards,
      createdBy
    });

    return res.status(201).json({
      success: true,
      message: 'Content node created successfully.',
      node: newNode
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create content node: ' + err.message });
  }
});

/**
 * PUT /api/content/:id
 * Updates an existing content node.
 * Security: Only Super Admin OR the author who created the node can edit!
 */
router.put('/:id', authenticateToken, requireRole('super_admin', 'branch_admin', 'content_creator', 'reviewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await ContentNodeModel.findOne({ id: req.params.id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Node not found.' });
    }

    // DATA ISOLATION & PERMISSION CHECK:
    // Super Admin can modify anything.
    // Branch Admin can modify nodes in their branch (for reviews, remarks, approval).
    // Content Admin can modify nodes they created.
    const user = req.user!;
    const isSuper = user.role === 'super_admin';
    const isAuthor = existing.createdBy === user.id;
    const isBranchAdmin = user.role === 'branch_admin' && (
      !user.assignedNodeId || existing.path.split('.').includes(user.assignedNodeId)
    );

    if (!isSuper && !isAuthor && !isBranchAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Security violation: Administrators may only modify content in their assigned branch or created by them.'
      });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.id; // Preserve immutable node identifier
    delete updates.createdBy; // Preserve original author attribution

    const updated = await ContentNodeModel.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Node updated successfully.',
      node: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update node: ' + err.message });
  }
});

/**
 * DELETE /api/content/:id
 * Deletes node and cascades subtree deletion.
 * Security: Only Super Admin OR the author who created the node can delete!
 */
router.delete('/:id', authenticateToken, requireRole('super_admin', 'branch_admin', 'content_creator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await ContentNodeModel.findOne({ id: req.params.id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Node not found.' });
    }

    // DATA ISOLATION ENFORCEMENT:
    if (req.user?.role !== 'super_admin' && existing.createdBy !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Security violation: Administrators may only delete content they personally authored.'
      });
    }

    // Cascade delete target node and all subtree descendants
    const pathPrefix = new RegExp(`(^|\\.)${existing.id}(\\.|$)`);
    const deleteResult = await ContentNodeModel.deleteMany({
      $or: [
        { id: existing.id },
        { path: pathPrefix }
      ]
    });

    return res.status(200).json({
      success: true,
      message: `Node and its subtree removed (${deleteResult.deletedCount} total nodes deleted).`,
      deletedId: existing.id
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete node: ' + err.message });
  }
});

/**
 * POST /api/content/:id/notes
 * Quick creation or update of notes for a specific topic node in /classroom
 */
router.post('/:id/notes', authenticateToken, requireRole('super_admin', 'branch_admin', 'content_creator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, contentMarkdown, keyTakeaways } = req.body;
    const node = await ContentNodeModel.findOne({ id: req.params.id });
    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found.' });
    }

    if (req.user?.role !== 'super_admin' && node.createdBy !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: Cannot edit notes on this topic.' });
    }

    node.notes = {
      title: title || node.translations.en?.title || 'Topic Notes',
      contentMarkdown: contentMarkdown || '',
      keyTakeaways: Array.isArray(keyTakeaways) ? keyTakeaways : []
    };
    await node.save();

    return res.status(200).json({
      success: true,
      message: 'Topic notes updated successfully.',
      notes: node.notes
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to save notes: ' + err.message });
  }
});

/**
 * POST /api/content/:id/flashcards
 * Quick creation of file cards (flashcards) for a specific topic node in /classroom
 */
router.post('/:id/flashcards', authenticateToken, requireRole('super_admin', 'branch_admin', 'content_creator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { front, back, hint } = req.body;
    if (!front || !back) {
      return res.status(400).json({ success: false, message: 'Front and back card content are required.' });
    }

    const node = await ContentNodeModel.findOne({ id: req.params.id });
    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found.' });
    }

    if (req.user?.role !== 'super_admin' && node.createdBy !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Permission denied: Cannot add file cards to this topic.' });
    }

    const newCard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      front: typeof front === 'string' ? { en: front, hi: front } : front,
      back: typeof back === 'string' ? { en: back, hi: back } : back,
      hint: hint ? (typeof hint === 'string' ? { en: hint, hi: hint } : hint) : undefined
    };

    if (!node.flashcards) node.flashcards = [];
    node.flashcards.push(newCard);
    await node.save();

    return res.status(200).json({
      success: true,
      message: 'New file card added successfully.',
      flashcard: newCard,
      totalCards: node.flashcards.length
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to add file card: ' + err.message });
  }
});

export const contentRouter = router;
