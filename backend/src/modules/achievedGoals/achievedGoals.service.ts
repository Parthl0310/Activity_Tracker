import mongoose from 'mongoose';
import { AchievedGoal, IAchievedGoal } from '../../models/AchievedGoal.js';
import { Activity } from '../../models/Activity.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  CreateAchievedGoalInput,
  UpdateAchievedGoalInput,
  ListAchievedGoalsQuery,
} from './achievedGoals.dto.js';

export interface PaginatedAchievedGoals {
  goals: IAchievedGoal[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class AchievedGoalsService {
  public async createGoal(
    userId: string,
    input: CreateAchievedGoalInput
  ): Promise<IAchievedGoal> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Validate that any passed activity IDs belong to this user
    let relatedObjectIds: mongoose.Types.ObjectId[] = [];
    if (input.relatedActivityIds && input.relatedActivityIds.length > 0) {
      const validStringIds = input.relatedActivityIds.filter((id) => mongoose.isValidObjectId(id));
      if (validStringIds.length > 0) {
        const validActivities = await Activity.find({
          _id: { $in: validStringIds },
          userId: userObjectId,
        }).select('_id');

        relatedObjectIds = validActivities.map((a) => a._id);
      }
    }

    const goal = await AchievedGoal.create({
      userId: userObjectId,
      title: input.title,
      description: input.description || '',
      project: input.project || '',
      category: input.category || '',
      impactScore: input.impactScore,
      keyOutcomes: input.keyOutcomes || [],
      completedAt: input.completedAt || new Date(),
      relatedActivityIds: relatedObjectIds,
    });

    return goal;
  }

  public async listGoals(
    userId: string,
    query: ListAchievedGoalsQuery
  ): Promise<PaginatedAchievedGoals> {
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (query.from || query.to) {
      filter.completedAt = {};
      if (query.from) {
        filter.completedAt.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.completedAt.$lte = new Date(query.to);
      }
    }

    if (query.q) {
      filter.$or = [
        { title: { $regex: query.q, $options: 'i' } },
        { description: { $regex: query.q, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [goals, total] = await Promise.all([
      AchievedGoal.find(filter)
        .populate({
          path: 'relatedActivityIds',
          select: 'text workDate project category skills',
        })
        .sort({ completedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AchievedGoal.countDocuments(filter),
    ]);

    return {
      goals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getGoalById(
    userId: string,
    goalId: string
  ): Promise<IAchievedGoal> {
    const goal = await AchievedGoal.findOne({
      _id: goalId,
      userId: new mongoose.Types.ObjectId(userId),
    }).populate({
      path: 'relatedActivityIds',
      select: 'text workDate project category skills workType',
    });

    if (!goal) {
      throw new AppError('Achieved goal not found', 404);
    }

    return goal;
  }

  public async updateGoal(
    userId: string,
    goalId: string,
    input: UpdateAchievedGoalInput
  ): Promise<IAchievedGoal> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const goal = await AchievedGoal.findOne({
      _id: goalId,
      userId: userObjectId,
    });

    if (!goal) {
      throw new AppError('Achieved goal not found', 404);
    }

    if (input.title !== undefined) goal.title = input.title;
    if (input.description !== undefined) goal.description = input.description;
    if (input.project !== undefined) goal.project = input.project;
    if (input.category !== undefined) goal.category = input.category;
    if (input.impactScore !== undefined) goal.impactScore = input.impactScore;
    if (input.keyOutcomes !== undefined) goal.keyOutcomes = input.keyOutcomes;
    if (input.completedAt !== undefined) goal.completedAt = input.completedAt;

    if (input.relatedActivityIds !== undefined) {
      const validStringIds = input.relatedActivityIds.filter((id) => mongoose.isValidObjectId(id));
      const validActivities = await Activity.find({
        _id: { $in: validStringIds },
        userId: userObjectId,
      }).select('_id');

      goal.relatedActivityIds = validActivities.map((a) => a._id);
    }

    await goal.save();
    return goal;
  }

  public async deleteGoal(userId: string, goalId: string): Promise<void> {
    const result = await AchievedGoal.findOneAndDelete({
      _id: goalId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      throw new AppError('Achieved goal not found', 404);
    }
  }

  public async linkActivities(
    userId: string,
    goalId: string,
    activityIds: string[]
  ): Promise<IAchievedGoal> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const goal = await AchievedGoal.findOne({
      _id: goalId,
      userId: userObjectId,
    });

    if (!goal) {
      throw new AppError('Achieved goal not found', 404);
    }

    // Verify activities belong to user
    const validActivities = await Activity.find({
      _id: { $in: activityIds },
      userId: userObjectId,
    }).select('_id');

    const validObjectIds = validActivities.map((a) => a._id);

    // Add unique activity references
    const updatedGoal = await AchievedGoal.findOneAndUpdate(
      { _id: goalId, userId: userObjectId },
      { $addToSet: { relatedActivityIds: { $each: validObjectIds } } },
      { new: true }
    ).populate({
      path: 'relatedActivityIds',
      select: 'text workDate project category skills',
    });

    if (!updatedGoal) {
      throw new AppError('Achieved goal not found', 404);
    }

    return updatedGoal;
  }
}

export const achievedGoalsService = new AchievedGoalsService();
