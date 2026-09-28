import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMonthlySummaryChunk {
  chunkId: string;
  chunkType: 'technical' | 'contribution' | 'learning' | 'project' | 'general';
  chunkText: string;
}

export interface IMonthlySummaryContent {
  majorWorkAreas: string[];
  skillsDemonstrated: string[];
  aiSummary: string;
  entryCount: number;
}

export interface IMonthlySummary extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  month: number;
  year: number;
  summary: IMonthlySummaryContent;
  sourceWeekIds: Types.ObjectId[];
  chunks: IMonthlySummaryChunk[];
  confidenceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlySummarySchema = new Schema<IMonthlySummary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    summary: {
      majorWorkAreas: {
        type: [String],
        default: [],
      },
      skillsDemonstrated: {
        type: [String],
        default: [],
      },
      aiSummary: {
        type: String,
        default: '',
      },
      entryCount: {
        type: Number,
        default: 0,
      },
    },
    sourceWeekIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'WeeklySummary',
      },
    ],
    chunks: [
      {
        chunkId: { type: String, required: true },
        chunkType: {
          type: String,
          enum: ['technical', 'contribution', 'learning', 'project', 'general'],
          default: 'general',
        },
        chunkText: { type: String, required: true },
      },
    ],
    confidenceScore: {
      type: Number,
      default: 0.95,
      min: 0,
      max: 1,
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

// Unique compound index: One summary per user per month and year
MonthlySummarySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export const MonthlySummary = mongoose.model<IMonthlySummary>(
  'MonthlySummary',
  MonthlySummarySchema
);
