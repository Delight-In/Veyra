import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { mailService } from '../services/mailService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'edunova_enterprise_secret_jwt_key_2026_secure_auth_9988';

// Generate random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate sequential student ID
async function generateStudentId(): Promise<string> {
  const latestStudent = await User.findOne({ studentId: { $regex: /^STU-\d+$/ } })
    .sort({ studentId: -1 })
    .lean();

  if (latestStudent && latestStudent.studentId) {
    const numPart = parseInt(latestStudent.studentId.replace('STU-', ''), 10);
    if (!isNaN(numPart)) {
      return `STU-${numPart + 1}`;
    }
  }
  return `STU-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * POST /api/auth/register
 * Sophisticated registration with email verification OTP
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { 
      name, email, password, role = 'learner', branchCategory 
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required.' 
      });
    }

    // Password check (allow minimum 4 characters for friendly dev/testing)
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      if (!existing.isEmailVerified) {
        // User started registration earlier but did not verify email
        const code = generateOtp();
        existing.verificationCode = code;
        existing.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await existing.save();

        await mailService.sendVerificationCode({
          to: normalizedEmail,
          name: existing.name,
          code
        });

        return res.status(200).json({
          success: true,
          requireVerification: true,
          email: normalizedEmail,
          message: 'An unverified account exists. A new verification code has been sent to your email.',
          testOtpCode: process.env.NODE_ENV !== 'production' ? code : undefined
        });
      }

      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email address already exists. Please log in.' 
      });
    }

    // Hash password with bcrypt (12 rounds)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Auto-generate student ID for learners
    let studentId: string | undefined = undefined;
    if (role === 'learner') {
      studentId = await generateStudentId();
    }

    // 6-digit verification code
    const verificationCode = generateOtp();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      studentId,
      branchCategory: branchCategory || (role === 'branch_admin' ? 'pcmb' : undefined),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      isEmailVerified: false,
      verificationCode,
      verificationCodeExpires,
      enrolledCourseIds: ['node_science'],
      notifications: [{
        id: `notif_${Date.now()}`,
        title: 'Welcome to EduNova!',
        message: 'Welcome to the platform! Please verify your email to access all interactive labs.',
        sender: 'EduNova System',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'info'
      }]
    });

    await newUser.save();

    // Send verification email
    await mailService.sendVerificationCode({
      to: normalizedEmail,
      name: newUser.name,
      code: verificationCode
    });

    return res.status(201).json({
      success: true,
      requireVerification: true,
      email: normalizedEmail,
      message: `Account created! We sent a 6-digit verification code to ${normalizedEmail}.`,
      testOtpCode: process.env.NODE_ENV !== 'production' ? verificationCode : undefined
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration: ' + err.message 
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Validates the 6-digit OTP code and issues JWT session token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and 6-digit verification code are required.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found.' 
      });
    }

    if (user.isEmailVerified) {
      // Already verified, generate token and return
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
        token,
        user: user.toSafeObject()
      });
    }

    // Check expiration
    if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please click "Resend Code" to receive a new one.'
      });
    }

    // Check code match (case-insensitive, trimmed)
    if (user.verificationCode !== code.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.'
      });
    }

    // Success: activate user account
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to EduNova.',
      token,
      user: user.toSafeObject()
    });
  } catch (err: any) {
    console.error('Verification error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during verification.' 
    });
  }
});

/**
 * POST /api/auth/resend-code
 * Dispatches a fresh 6-digit OTP code to the user's email
 */
router.post('/resend-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    const newCode = generateOtp();
    user.verificationCode = newCode;
    user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await mailService.sendVerificationCode({
      to: normalizedEmail,
      name: user.name,
      code: newCode
    });

    return res.status(200).json({
      success: true,
      message: `A new 6-digit verification code has been dispatched to ${normalizedEmail}.`,
      testOtpCode: process.env.NODE_ENV !== 'production' ? newCode : undefined
    });
  } catch (err: any) {
    console.error('Resend error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resend code.' });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials and verifies that email is active
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // Auto-create Super Admin Priyanka if MongoDB was seeded earlier without her
    if (!user && normalizedEmail === 'priyanka@veyra.com') {
      const salt = await bcrypt.genSalt(12);
      user = await User.create({
        name: 'Priyanka (प्रियंका - Founder & CAO)',
        email: 'priyanka@veyra.com',
        password: await bcrypt.hash('Admin@123', salt),
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science', 'node_math', 'node_cs', 'node_kids_universe'],
        completedNodeIds: [],
        adminRemarks: [{
          id: 'rem_priyanka_1',
          authorName: 'System Governance',
          authorRole: 'super_admin',
          text: 'Founder & Chief Administrator. Physics Honours Graduate & IT Specialist. Full platform authority.',
          timestamp: new Date().toISOString(),
          flag: 'good'
        }],
        notifications: [{
          id: 'notif_priyanka_1',
          title: 'Super Admin Access Active',
          message: 'Welcome to Veyra platform administration console, Priyanka.',
          sender: 'Veyra System Security',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'urgent'
        }]
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // Check email verification status
    if (!user.isEmailVerified) {
      // Generate fresh code if none exists or if expired
      let code = user.verificationCode;
      if (!code || !user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
        code = generateOtp();
        user.verificationCode = code;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await mailService.sendVerificationCode({
          to: normalizedEmail,
          name: user.name,
          code
        });
      }

      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: normalizedEmail,
        message: 'Please verify your email address before logging in.',
        testOtpCode: process.env.NODE_ENV !== 'production' ? code : undefined
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: user.toSafeObject()
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login.' 
    });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }
  return res.status(200).json({
    success: true,
    user: req.user.toSafeObject()
  });
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // For security, don't reveal whether user exists
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with this email, a reset code has been sent.' 
      });
    }

    const resetCode = generateOtp();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await mailService.sendPasswordResetCode({
      to: user.email,
      name: user.name,
      code: resetCode
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset code has been dispatched to your email.',
      email: user.email,
      testResetCode: process.env.NODE_ENV !== 'production' ? resetCode : undefined
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error processing request.' });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, reset code, and new password are required.' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 8 characters long.' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetPasswordCode || user.resetPasswordCode !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset code.' });
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'Password reset code has expired.' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated. You may now log in.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error updating password.' });
  }
});

export const authRouter = router;
