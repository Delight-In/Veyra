import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/users
 * Returns paginated list of all users for Super Admin directory ONLY.
 * Security: Created admins do not have access to user data.
 */
router.get('/', authenticateToken, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.role && typeof req.query.role === 'string') {
      query.role = req.query.role;
    }
    if (req.query.branchCategory && typeof req.query.branchCategory === 'string') {
      query.branchCategory = req.query.branchCategory;
    }
    if (req.query.search && typeof req.query.search === 'string') {
      const q = req.query.search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users: users.map(u => u.toSafeObject())
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users: ' + err.message });
  }
});

/**
 * POST /api/users
 * Super Admin creates Branch Admins / Admins in MongoDB.
 * Branch Admin creates Content Admins scoped to their branch in MongoDB.
 */
router.post('/', authenticateToken, requireRole('super_admin', 'branch_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name, email, password, role = 'branch_admin',
      branchCategory = 'pcmb', assignedBranchName, assignedNodeId
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: `An account with email "${cleanEmail}" already exists.` });
    }

    const isBranchAdmin = req.user?.role === 'branch_admin';
    // Branch Admin can only create content admins
    const targetRole = isBranchAdmin ? 'content_creator' : role;
    const targetBranchCategory = isBranchAdmin ? (req.user?.branchCategory || 'pcmb') : branchCategory;
    const targetBranchName = isBranchAdmin 
      ? (req.user?.assignedBranchName || assignedBranchName || 'Branch Content Studio')
      : (assignedBranchName || (branchCategory === 'cs' ? 'Computer Science & AI' : 'Natural Sciences & PCMB'));
    const targetNodeId = isBranchAdmin
      ? (assignedNodeId || req.user?.assignedNodeId || 'node_science')
      : (assignedNodeId || (branchCategory === 'cs' ? 'node_cs' : 'node_science'));

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: targetRole,
      branchCategory: targetBranchCategory,
      assignedBranchName: targetBranchName,
      assignedNodeId: targetNodeId,
      createdBy: req.user?.id,
      performanceScore: 92,
      evaluationRating: 5,
      evaluationRemarks: isBranchAdmin 
        ? `Newly provisioned Content Admin under ${req.user?.name}. Ready to author and preview curriculum content.`
        : 'Initial administrative profile.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      enrolledCourseIds: [targetNodeId, 'node_science', 'node_math', 'node_cs'],
      isEmailVerified: true,
      notifications: [{
        id: `notif_${Date.now()}`,
        sender: req.user?.name || 'Administration',
        senderRole: req.user?.role || 'branch_admin',
        title: 'Content Administrator Credentials Active',
        message: isBranchAdmin 
          ? `Welcome! You have been appointed as Content Admin by Branch Admin ${req.user?.name} for ${targetBranchName}. Take care of creating content, ensuring display accuracy, and submitting for branch approval.`
          : `Your administrator profile has been created with ${role} authority over ${targetBranchName}.`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'urgent'
      }],
      adminRemarks: [{
        id: `rem_${Date.now()}`,
        authorName: req.user?.name || 'Branch Admin',
        authorRole: req.user?.role || 'branch_admin',
        text: `Content Administrator created by ${req.user?.name} on ${new Date().toLocaleDateString()}. Assigned to ${targetBranchName}.`,
        timestamp: new Date().toISOString(),
        flag: 'good'
      }]
    });

    return res.status(201).json({
      success: true,
      message: `Administrator "${newUser.name}" successfully created in MongoDB.`,
      user: newUser.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create user: ' + err.message });
  }
});

/**
 * GET /api/users/my-creators
 * Branch Admin retrieves ONLY the Content Admins created by themselves.
 */
router.get('/my-creators', authenticateToken, requireRole('branch_admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === 'super_admin';
    const query: any = {
      role: { $in: ['content_creator', 'content_admin'] }
    };

    if (!isSuperAdmin) {
      query.$or = [
        { createdBy: req.user?.id },
        { assignedNodeId: req.user?.assignedNodeId }
      ];
    }

    const creators = await User.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: creators.length,
      creators: creators.map(c => c.toSafeObject())
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve branch creators: ' + err.message });
  }
});

/**
 * PATCH /api/users/:id/evaluate
 * Branch Admin evaluates progress & quality of a Content Admin they oversee.
 */
router.patch('/:id/evaluate', authenticateToken, requireRole('branch_admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { performanceScore, evaluationRating, evaluationRemarks } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Content Admin not found.' });
    }

    // Branch Admin can only evaluate creators they created or in their branch
    if (req.user?.role === 'branch_admin' && targetUser.createdBy !== req.user?.id && targetUser.assignedNodeId !== req.user?.assignedNodeId) {
      return res.status(403).json({ success: false, message: 'Access denied: You may only evaluate Content Admins you created.' });
    }

    if (performanceScore !== undefined) targetUser.performanceScore = Number(performanceScore);
    if (evaluationRating !== undefined) targetUser.evaluationRating = Number(evaluationRating);
    if (evaluationRemarks !== undefined) targetUser.evaluationRemarks = String(evaluationRemarks);
    targetUser.lastEvaluatedAt = new Date();

    const notif = {
      id: `notif_eval_${Date.now()}`,
      title: 'Performance Progress Updated 📊',
      message: `Branch Admin ${req.user?.name} has reviewed your content quality: Score: ${targetUser.performanceScore}/100, Rating: ${targetUser.evaluationRating}/5. Remarks: "${evaluationRemarks || 'Good progress'}"`,
      sender: req.user?.name || 'Branch Administration',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'info' as const
    };
    targetUser.notifications.unshift(notif);

    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Evaluation for ${targetUser.name} updated successfully.`,
      user: targetUser.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to evaluate Content Admin: ' + err.message });
  }
});

/**
 * GET /api/users/child/:identifier
 * Secure lookup of student record by studentId, userId, or email
 */
router.get('/child/:identifier', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const identifier = req.params.identifier.trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier is required.' });
    }

    const query: any = {
      $or: [
        { studentId: identifier.toUpperCase() },
        { _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : undefined },
        { email: identifier.toLowerCase() }
      ].filter(Boolean)
    };

    const student = await User.findOne(query);

    if (!student || (student.role !== 'learner' && !student.studentId)) {
      return res.status(404).json({
        success: false,
        message: `No student record found matching Student ID: "${identifier}".`
      });
    }

    return res.status(200).json({
      success: true,
      student: student.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lookup error: ' + err.message });
  }
});

/**
 * POST /api/users/enroll
 * Authenticated student/user enrolls in a course
 */
router.post('/enroll', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const user = req.user!;
    if (!user.enrolledCourseIds.includes(courseId)) {
      user.enrolledCourseIds.push(courseId);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Course enrolled successfully.',
      user: user.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to enroll in course: ' + err.message });
  }
});

/**
 * POST /api/users/unenroll
 * Authenticated student/user unenrolls from a course
 */
router.post('/unenroll', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const user = req.user!;
    user.enrolledCourseIds = user.enrolledCourseIds.filter(id => id !== courseId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Course un-enrolled successfully.',
      user: user.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to unenroll: ' + err.message });
  }
});

/**
 * POST /api/users/:id/remark
 * Super Admin adds an administrative remark to any user
 */
router.post('/:id/remark', authenticateToken, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, flag = 'info' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Remark text is required.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    const newRemark = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorName: req.user?.name || 'Super Admin',
      authorRole: req.user?.role || 'super_admin',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      flag
    };

    targetUser.adminRemarks.unshift(newRemark);
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: 'Administrative remark added successfully.',
      remark: newRemark,
      user: targetUser.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error adding remark: ' + err.message });
  }
});

/**
 * DELETE /api/users/:id/remark/:remarkId
 * Super Admin deletes an administrative remark
 */
router.delete('/:id/remark/:remarkId', authenticateToken, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    targetUser.adminRemarks = targetUser.adminRemarks.filter(r => r.id !== req.params.remarkId);
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: 'Remark deleted.',
      user: targetUser.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error deleting remark.' });
  }
});

/**
 * POST /api/users/:id/message
 * Sends a direct message notification to a specific user
 */
router.post('/:id/message', authenticateToken, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, priority = 'info' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message content are required.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      message: message.trim(),
      sender: req.user?.name || 'Administration',
      timestamp: new Date().toISOString(),
      read: false,
      priority
    };

    targetUser.notifications.unshift(notif);
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Message dispatched directly to ${targetUser.name}.`,
      notification: notif
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error dispatching message.' });
  }
});

/**
 * POST /api/users/broadcast
 * Dispatches a platform-wide message to all users
 */
router.post('/broadcast', authenticateToken, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, priority = 'info' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const notif = {
      id: `broadcast_${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      sender: 'Super Administration [BROADCAST]',
      timestamp: new Date().toISOString(),
      read: false,
      priority
    };

    await User.updateMany({}, {
      $push: { notifications: { $each: [notif], $position: 0 } }
    });

    return res.status(200).json({
      success: true,
      message: 'Global announcement successfully broadcasted to all users.',
      broadcast: notif
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error broadcasting message.' });
  }
});

/**
 * PATCH /api/users/:id/role
 * Super Admin updates role and branch assignment
 */
router.patch('/:id/role', authenticateToken, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, branchCategory, assignedNodeId, assignedBranchName } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) targetUser.role = role;
    if (branchCategory !== undefined) targetUser.branchCategory = branchCategory;
    if (assignedNodeId !== undefined) targetUser.assignedNodeId = assignedNodeId;
    if (assignedBranchName !== undefined) targetUser.assignedBranchName = assignedBranchName;

    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: 'User permissions updated successfully.',
      user: targetUser.toSafeObject()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error updating role: ' + err.message });
  }
});

/**
 * DELETE /api/users/:id
 * Super Admin deletes a user/administrator account
 */
router.delete('/:id', authenticateToken, requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    if (req.user?.userId === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete the active Super Admin account.' });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { email: id.toLowerCase() };

    await User.findOneAndDelete(query);
    return res.status(200).json({
      success: true,
      message: 'Account removed successfully.',
      deletedId: id
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error deleting user: ' + err.message });
  }
});

export const userRouter = router;
