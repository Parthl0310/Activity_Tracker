import mongoose, { Document, Schema, Types } from 'mongoose';

export type SummaryStatus = 'generated' | 'reviewed' | 'edited';

export interface IWeeklySummaryContent {
  majorWork: string[];
  technicalAreas: string[];
  aiInsight: string;
  entryCount: number;
}

export interface IWeeklySummary extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  summary: IWeeklySummaryContent;
  confidenceScore: number;
  status: SummaryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklySummarySchema = new Schema<IWeeklySummary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    weekStart: {
      type: Date,
      required: true,
      index: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    summary: {
      majorWork: {
        type: [String],
        default: [],
      },
      technicalAreas: {
        type: [String],
        default: [],
      },
      aiInsight: {
        type: String,
        default: '',
      },
      entryCount: {
        type: Number,
        default: 0,
      },
    },
    confidenceScore: {
      type: Number,
      default: 0.95,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ['generated', 'reviewed', 'edited'],
      default: 'generated',
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

// Unique compound index: One summary per user per weekStart
WeeklySummarySchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklySummary = mongoose.model<IWeeklySummary>(
  'WeeklySummary',
  WeeklySummarySchema
);
