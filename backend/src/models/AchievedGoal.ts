import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAchievedGoal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description: string;
  project?: string;
  category?: string;
  impactScore?: number;
  keyOutcomes: string[];
  completedAt: Date;
  relatedActivityIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AchievedGoalSchema = new Schema<IAchievedGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    project: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    impactScore: {
      type: Number,
      default: undefined,
    },
    keyOutcomes: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    relatedActivityIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
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

// Compound index for user timeline queries
AchievedGoalSchema.index({ userId: 1, completedAt: -1 });

export const AchievedGoal = mongoose.model<IAchievedGoal>(
  'AchievedGoal',
  AchievedGoalSchema
);
