import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogDoc extends Document {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  authorBio?: string;
  coverImage?: string;
  coverImageCaption?: string;
  tags: string[];
  readTimeMinutes: number;
  claps: number;
  status: 'draft' | 'published';
  publishedAt: string;
  featured?: boolean;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlogDoc>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subtitle: {
    type: String,
    default: '',
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  authorId: {
    type: String,
    required: true,
    default: 'admin_super_1',
  },
  authorName: {
    type: String,
    required: true,
    default: 'Priyanka (Super Admin)',
  },
  authorRole: {
    type: String,
    default: 'Super Admin • Chief Academic Officer',
  },
  authorAvatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  authorBio: {
    type: String,
    default: 'Physics Honours & IT Specialist. Founder at Veyra.',
  },
  coverImage: {
    type: String,
    default: '',
  },
  coverImageCaption: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: ['Cognitive Science', 'Simulations'],
  },
  readTimeMinutes: {
    type: Number,
    default: 3,
  },
  claps: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true,
  },
  publishedAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  featured: {
    type: Boolean,
    default: false,
  },
  videoUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export const Blog = mongoose.models.Blog || mongoose.model<IBlogDoc>('Blog', BlogSchema);
