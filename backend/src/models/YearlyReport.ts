import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportStatus = 'draft' | 'reviewed' | 'final';

export interface IYearlyReportContent {
  executiveSummary: string;
  majorContributions: string;
  technicalWork: string;
  skillsDemonstrated: string;
  projects: string;
  achievedGoals: string;
  learningAndDevelopment: string;
  overallYearSummary: string;
}

export type ReportSectionName = keyof IYearlyReportContent;

export interface IYearlyReport extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  year: number;
  report: IYearlyReportContent;
  version: number;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const YearlyReportSchema = new Schema<IYearlyReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    report: {
      executiveSummary: { type: String, default: '' },
      majorContributions: { type: String, default: '' },
      technicalWork: { type: String, default: '' },
      skillsDemonstrated: { type: String, default: '' },
      projects: { type: String, default: '' },
      achievedGoals: { type: String, default: '' },
      learningAndDevelopment: { type: String, default: '' },
      overallYearSummary: { type: String, default: '' },
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'reviewed', 'final'],
      default: 'draft',
      index: true,
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

// Unique compound index for user, year, and version
YearlyReportSchema.index({ userId: 1, year: 1, version: 1 }, { unique: true });

export const YearlyReport = mongoose.model<IYearlyReport>(
  'YearlyReport',
  YearlyReportSchema
);
