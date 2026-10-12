import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'edunova_enterprise_secret_jwt_key_2026_secure_auth_9988';

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found or has been revoked.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        success: false, 
        requireVerification: true,
        email: user.email,
        message: 'Email address has not been verified.' 
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication session.' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: This resource requires one of the following roles: [${roles.join(', ')}]. Current role: ${req.user.role}` 
      });
    }

    next();
  };
};
