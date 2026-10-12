import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitorStats extends Document {
  key: string;
  count: number;
  lastVisitedAt: Date;
}

const VisitorStatsSchema: Schema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'platform_visitors'
  },
  count: {
    type: Number,
    required: true,
    default: 0
  },
  lastVisitedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const VisitorStats = mongoose.model<IVisitorStats>('VisitorStats', VisitorStatsSchema);
