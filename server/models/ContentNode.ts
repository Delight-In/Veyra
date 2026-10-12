import mongoose, { Schema, Document } from 'mongoose';

export interface IContentNodeDoc extends Document {
  id: string;
  parentId: string | null;
  path: string;
  depth: number;
  type: string;
  order: number;
  status: 'draft' | 'in_review' | 'needs_revision' | 'published';
  targetAgeBand: string;
  estimatedMinutes?: number;
  branchAdminRemark?: string;
  reviewRemarks?: Array<{ id: string; remark: string; author: string; timestamp: string }>;
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  translations: {
    en?: {
      language: string;
      title: string;
      description: string;
      body?: string;
      summary?: string;
      transcript?: string;
    };
    hi?: {
      language: string;
      title: string;
      description: string;
      body?: string;
      summary?: string;
      transcript?: string;
    };
  };
  videoData?: Record<string, any>;
  simulationConfig?: Record<string, any>;
  codingProblem?: Record<string, any>;
  flowchart?: Record<string, any>;
  audioExplanation?: Record<string, any>;
  images?: Array<{ url: string; caption?: string; altText?: string }>;
  quizQuestions?: Array<Record<string, any>>;
  flashcards?: Array<Record<string, any>>;
  notes?: {
    title?: string;
    contentMarkdown?: string;
    keyTakeaways?: string[];
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentNodeSchema = new Schema<IContentNodeDoc>({
  id: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  parentId: { 
    type: String, 
    default: null, 
    index: true 
  },
  path: { 
    type: String, 
    required: true, 
    index: true 
  },
  depth: { 
    type: Number, 
    default: 0 
  },
  type: { 
    type: String, 
    required: true, 
    index: true 
  },
  order: { 
    type: Number, 
    default: 10 
  },
  status: { 
    type: String, 
    enum: ['draft', 'in_review', 'needs_revision', 'published'], 
    default: 'draft',
    index: true 
  },
  branchAdminRemark: { type: String },
  reviewRemarks: { type: [Schema.Types.Mixed], default: [] },
  submittedBy: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  targetAgeBand: { 
    type: String, 
    default: 'all' 
  },
  estimatedMinutes: { 
    type: Number, 
    default: 10 
  },
  translations: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  videoData: { type: Schema.Types.Mixed },
  simulationConfig: { type: Schema.Types.Mixed },
  codingProblem: { type: Schema.Types.Mixed },
  flowchart: { type: Schema.Types.Mixed },
  audioExplanation: { type: Schema.Types.Mixed },
  images: [{
    url: { type: String, required: true },
    caption: { type: String },
    altText: { type: String }
  }],
  quizQuestions: { type: [Schema.Types.Mixed], default: [] },
  flashcards: { type: [Schema.Types.Mixed], default: [] },
  notes: {
    title: { type: String },
    contentMarkdown: { type: String },
    keyTakeaways: { type: [String], default: [] }
  },
  createdBy: { 
    type: String, 
    required: true, 
    index: true 
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for large audience high-performance tree queries
ContentNodeSchema.index({ status: 1, type: 1 });
ContentNodeSchema.index({ createdBy: 1, status: 1 });
ContentNodeSchema.index({ parentId: 1, order: 1 });

export const ContentNodeModel = mongoose.model<IContentNodeDoc>('ContentNode', ContentNodeSchema);
