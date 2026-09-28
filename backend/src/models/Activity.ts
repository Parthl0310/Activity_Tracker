import mongoose, { Document, Schema, Types } from 'mongoose';

export const ACTIVITY_CATEGORIES = [
  'Bug Fix',
  'Feature',
  'Optimization',
  'Refactor',
  'Learning',
  'Discussion',
  'Production Issue',
  'Documentation',
  'Other',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const ACTIVITY_WORK_TYPES = ['Technical', 'Non-Technical', 'Learning'] as const;
export type ActivityWorkType = (typeof ACTIVITY_WORK_TYPES)[number];

export type EnrichmentStatus = 'pending' | 'done' | 'failed';

export interface IActivity extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title?: string;
  text: string;
  aiRefinedText?: string;
  workDate: Date;
  project?: string;
  category?: ActivityCategory;
  skills: string[];
  keywords: string[];
  workType?: ActivityWorkType;
  vectorIndexed: boolean;
  embeddingModelVersion?: string;
  enrichmentStatus: EnrichmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    aiRefinedText: {
      type: String,
      trim: true,
    },
    workDate: {
      type: Date,
      index: true,
      required: true,
    },
    project: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    category: {
      type: String,
      enum: ACTIVITY_CATEGORIES,
    },
    skills: {
      type: [String],
      default: [],
    },
    keywords: {
      type: [String],
      default: [],
    },
    workType: {
      type: String,
      enum: ACTIVITY_WORK_TYPES,
    },
    vectorIndexed: {
      type: Boolean,
      default: false,
    },
    embeddingModelVersion: {
      type: String,
    },
    enrichmentStatus: {
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes as specified in schema design
ActivitySchema.index({ userId: 1, workDate: -1 });
ActivitySchema.index({ userId: 1, project: 1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
