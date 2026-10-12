import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminRemark {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
  flag?: 'good' | 'warning' | 'info' | 'critical';
}

export interface IUserNotification {
  id: string;
  title: string;
  message: string;
  sender: string;
  timestamp: string;
  read: boolean;
  priority?: 'urgent' | 'warning' | 'info';
}

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'branch_admin' | 'content_admin' | 'content_creator' | 'reviewer' | 'learner';
  studentId?: string;
  branchCategory?: 'pcmb' | 'cs' | 'other';
  assignedNodeId?: string;
  assignedBranchName?: string;
  enrolledCourseIds: string[];
  completedNodeIds: string[];
  chatEnabled?: boolean;
  avatar?: string;
  createdBy?: string;
  performanceScore?: number;
  evaluationRating?: number;
  evaluationRemarks?: string;
  lastEvaluatedAt?: Date;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  verificationToken?: string;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  adminRemarks: IAdminRemark[];
  notifications: IUserNotification[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Record<string, any>;
}

const AdminRemarkSchema = new Schema<IAdminRemark>({
  id: { type: String, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  flag: { type: String, enum: ['good', 'warning', 'info', 'critical'], default: 'info' }
}, { _id: false });

const UserNotificationSchema = new Schema<IUserNotification>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sender: { type: String, required: true },
  timestamp: { type: String, required: true },
  read: { type: Boolean, default: false },
  priority: { type: String, enum: ['urgent', 'warning', 'info'], default: 'info' }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['super_admin', 'branch_admin', 'content_admin', 'content_creator', 'reviewer', 'learner'],
    default: 'learner' 
  },
  studentId: { 
    type: String, 
    sparse: true, 
    unique: true,
    index: true 
  },
  branchCategory: { 
    type: String, 
    enum: ['pcmb', 'cs', 'other'] 
  },
  assignedNodeId: { type: String },
  assignedBranchName: { type: String },
  enrolledCourseIds: { type: [String], default: [] },
  completedNodeIds: { type: [String], default: [] },
  chatEnabled: { type: Boolean, default: true },
  avatar: { type: String },
  createdBy: { type: String, index: true },
  performanceScore: { type: Number, default: 90 },
  evaluationRating: { type: Number, default: 5 },
  evaluationRemarks: { type: String },
  lastEvaluatedAt: { type: Date },

  // Sophisticated Email Verification
  isEmailVerified: { type: Boolean, default: false, index: true },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  verificationToken: { type: String },

  // Password Recovery
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },

  adminRemarks: { type: [AdminRemarkSchema], default: [] },
  notifications: { type: [UserNotificationSchema], default: [] }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret.password;
      delete ret.verificationCode;
      delete ret.verificationCodeExpires;
      delete ret.verificationToken;
      delete ret.resetPasswordCode;
      delete ret.resetPasswordExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual ID getter
UserSchema.virtual('id').get(function(this: IUser) {
  return this._id.toString();
});

// Compare password helper
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe object helper
UserSchema.methods.toSafeObject = function(this: IUser): Record<string, any> {
  const obj = this.toObject();
  obj.id = this._id.toString();
  delete obj.password;
  delete obj.verificationCode;
  delete obj.verificationCodeExpires;
  delete obj.verificationToken;
  delete obj.resetPasswordCode;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);
