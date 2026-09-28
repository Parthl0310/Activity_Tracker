import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  jobRole?: string;
  department?: string;
  reviewYear?: number;
  skills: string[];
  currentProjects: string[];
  joiningDate?: Date;
  professionalBackground?: string;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    jobRole: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    reviewYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    skills: {
      type: [String],
      default: [],
    },
    currentProjects: {
      type: [String],
      default: [],
    },
    joiningDate: {
      type: Date,
    },
    professionalBackground: {
      type: String,
      default: '',
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
