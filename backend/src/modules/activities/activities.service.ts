import mongoose from 'mongoose';
import { Activity, IActivity } from '../../models/Activity.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  CreateActivityInput,
  UpdateActivityInput,
  ListActivitiesQuery,
} from './activities.dto.js';
import { addEnrichmentJob } from '../../jobs/queue.js';
import { detectVagueEntry, deleteVector, enrichActivity, improveActivityDescription } from '@activity-tracker/ai';

export interface PaginatedActivities {
  activities: IActivity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ActivitiesService {
  public async enrichPreview(
    userId: string,
    text: string,
    project?: string
  ) {
    const enriched = await enrichActivity(userId, 'preview', text);
    return {
      ...enriched,
      project: project || enriched.project || '',
    };
  }

  public async createActivity(
    userId: string,
    input: CreateActivityInput
  ): Promise<IActivity> {
    const title =
      input.title ||
      (input.text.length > 60 ? input.text.slice(0, 60).trim() + '...' : input.text);

    const isAlreadyEnriched = Boolean(
      input.aiRefinedText || (input.skills && input.skills.length > 0) || input.category
    );

    const activity = await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      text: input.text,
      aiRefinedText: input.aiRefinedText,
      workDate: input.workDate,
      project: input.project || '',
      category: input.category,
      skills: input.skills || [],
      keywords: input.keywords || [],
      workType: input.workType,
      vectorIndexed: false,
      enrichmentStatus: isAlreadyEnriched ? 'done' : 'pending',
    });

    // Trigger background AI enrichment & Pinecone indexing
    await addEnrichmentJob({ activityId: activity._id.toString(), userId });

    return activity;
  }

  public async listActivities(
    userId: string,
    query: ListActivitiesQuery
  ): Promise<PaginatedActivities> {
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (query.from || query.to) {
      filter.workDate = {};
      if (query.from) {
        filter.workDate.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.workDate.$lte = new Date(query.to);
      }
    }

    if (query.project) {
      filter.project = { $regex: query.project, $options: 'i' };
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.q) {
      const words = query.q.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        filter.$and = words.map((word) => {
          const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return {
            $or: [
              { title: { $regex: escaped, $options: 'i' } },
              { text: { $regex: escaped, $options: 'i' } },
              { aiRefinedText: { $regex: escaped, $options: 'i' } },
              { project: { $regex: escaped, $options: 'i' } },
              { category: { $regex: escaped, $options: 'i' } },
              { workType: { $regex: escaped, $options: 'i' } },
              { skills: { $in: [new RegExp(escaped, 'i')] } },
              { keywords: { $in: [new RegExp(escaped, 'i')] } },
            ],
          };
        });
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .sort({ workDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(filter),
    ]);

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getActivityById(
    userId: string,
    activityId: string
  ): Promise<IActivity> {
    if (!mongoose.isValidObjectId(activityId)) {
      throw new AppError('Activity not found', 404);
    }

    const activity = await Activity.findOne({
      _id: activityId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    return activity;
  }

  public async updateActivity(
    userId: string,
    activityId: string,
    input: UpdateActivityInput
  ): Promise<IActivity> {
    if (!mongoose.isValidObjectId(activityId)) {
      throw new AppError('Activity not found', 404);
    }

    const activity = await Activity.findOne({
      _id: activityId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    const textChanged = input.text !== undefined && input.text !== activity.text;
    const updateFields: Record<string, any> = {};

    if (input.title !== undefined) updateFields.title = input.title;
    if (input.text !== undefined) updateFields.text = input.text;
    if (input.aiRefinedText !== undefined) updateFields.aiRefinedText = input.aiRefinedText;
    if (input.workDate !== undefined) updateFields.workDate = input.workDate;
    if (input.project !== undefined) updateFields.project = input.project;
    if (input.category !== undefined) updateFields.category = input.category;
    if (input.skills !== undefined) updateFields.skills = input.skills;
    if (input.keywords !== undefined) updateFields.keywords = input.keywords;
    if (input.workType !== undefined) updateFields.workType = input.workType;

    if (textChanged) {
      try {
        const enriched = await enrichActivity(userId, activityId, input.text!);
        if (enriched.skills && enriched.skills.length > 0 && input.skills === undefined) {
          updateFields.skills = enriched.skills;
        }
        if (enriched.keywords && enriched.keywords.length > 0 && input.keywords === undefined) {
          updateFields.keywords = enriched.keywords;
        }
        if (enriched.aiRefinedText && input.aiRefinedText === undefined) {
          updateFields.aiRefinedText = enriched.aiRefinedText;
        }
        if (enriched.category && input.category === undefined) {
          updateFields.category = enriched.category;
        }
        if (enriched.workType && input.workType === undefined) {
          updateFields.workType = enriched.workType;
        }
        if (enriched.project && !activity.project && input.project === undefined) {
          updateFields.project = enriched.project;
        }
        updateFields.enrichmentStatus = 'done';
      } catch (err: any) {
        console.warn('[updateActivity] AI re-enrichment fallback:', err.message);
        updateFields.enrichmentStatus = 'pending';
      }
      updateFields.vectorIndexed = false;
      await addEnrichmentJob({ activityId: activity._id.toString(), userId });
    }

    const updated = await Activity.findOneAndUpdate(
      {
        _id: activityId,
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      throw new AppError('Activity not found', 404);
    }

    return updated;
  }

  public async deleteActivity(
    userId: string,
    activityId: string
  ): Promise<void> {
    if (!mongoose.isValidObjectId(activityId)) {
      throw new AppError('Activity not found', 404);
    }

    const result = await Activity.findOneAndDelete({
      _id: activityId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      throw new AppError('Activity not found', 404);
    }

    try {
      await deleteVector('activities', activityId);
    } catch (err: any) {
      console.warn(`[Pinecone] Failed to delete vector for activity ${activityId}:`, err.message);
    }
  }

  public async improveEntry(
    userId: string,
    activityId: string
  ): Promise<{ originalText: string; suggestion: string }> {
    const activity = await this.getActivityById(userId, activityId);

    // Call dedicated AI improvement engine that strips any repetitive prefix and rewrites cleanly
    const improved = await improveActivityDescription(activity.text);

    return {
      originalText: activity.text,
      suggestion: improved || activity.text,
    };
  }
}

export const activitiesService = new ActivitiesService();
