import mongoose from 'mongoose';
import { WeeklySummary, IWeeklySummary } from '../../models/WeeklySummary.js';
import { Activity } from '../../models/Activity.js';
import { AppError } from '../../middleware/error.middleware.js';
import { EditWeeklySummaryInput } from './summaries.dto.js';
import { generateWeeklySummary as aiGenerateWeeklySummary } from '@activity-tracker/ai';

export class WeeklySummaryService {
  public async getWeeklySummary(
    userId: string,
    weekStart: Date
  ): Promise<IWeeklySummary> {
    const summary = await WeeklySummary.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      weekStart: {
        $gte: new Date(new Date(weekStart).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(weekStart).setHours(23, 59, 59, 999)),
      },
    });

    if (!summary) {
      throw new AppError('Weekly summary not found for specified week', 404);
    }

    return summary;
  }

  public async generateWeeklySummary(
    userId: string,
    weekStart: Date,
    providedWeekEnd?: Date
  ): Promise<IWeeklySummary> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);

    const end = providedWeekEnd
      ? new Date(providedWeekEnd)
      : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 3600 * 1000);
    end.setHours(23, 59, 59, 999);

    // Fetch all user activities for this week
    const activities = await Activity.find({
      userId: userObjectId,
      workDate: { $gte: start, $lte: end },
    }).sort({ workDate: 1 });

    const entryCount = activities.length;
    let majorWork: string[] = [];
    let technicalAreas: string[] = [];
    let aiInsight = `No work entries recorded for the week starting ${start.toLocaleDateString()}.`;

    if (entryCount > 0) {
      const aiResponse = await aiGenerateWeeklySummary(
        userId,
        start,
        end,
        activities.map(a => ({
          date: a.workDate.toISOString(),
          text: a.aiRefinedText || a.text,
          category: a.category || 'General',
          project: a.project || 'General',
          skills: a.skills || []
        }))
      );
      majorWork = aiResponse.majorWork;
      technicalAreas = aiResponse.technicalAreas;
      aiInsight = aiResponse.aiInsight;
    }

    const summaryDoc = await WeeklySummary.findOneAndUpdate(
      { userId: userObjectId, weekStart: start },
      {
        weekEnd: end,
        summary: {
          majorWork,
          technicalAreas,
          aiInsight,
          entryCount,
        },
        confidenceScore: entryCount >= 3 ? 0.96 : 0.7,
        status: 'generated',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return summaryDoc;
  }

  public async regenerateWeeklySummary(
    userId: string,
    summaryId: string
  ): Promise<IWeeklySummary> {
    const existing = await WeeklySummary.findOne({
      _id: summaryId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existing) {
      throw new AppError('Weekly summary not found', 404);
    }

    return this.generateWeeklySummary(userId, existing.weekStart, existing.weekEnd);
  }

  public async editWeeklySummary(
    userId: string,
    summaryId: string,
    input: EditWeeklySummaryInput
  ): Promise<IWeeklySummary> {
    const summary = await WeeklySummary.findOne({
      _id: summaryId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!summary) {
      throw new AppError('Weekly summary not found', 404);
    }

    if (input.majorWork !== undefined) summary.summary.majorWork = input.majorWork;
    if (input.technicalAreas !== undefined)
      summary.summary.technicalAreas = input.technicalAreas;
    if (input.aiInsight !== undefined) summary.summary.aiInsight = input.aiInsight;

    summary.status = 'edited';
    await summary.save();
    return summary;
  }

  public async listWeeklySummaries(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ summaries: IWeeklySummary[]; total: number; page: number; totalPages: number }> {
    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    const skip = (page - 1) * limit;

    const [summaries, total] = await Promise.all([
      WeeklySummary.find(filter).sort({ weekStart: -1 }).skip(skip).limit(limit),
      WeeklySummary.countDocuments(filter),
    ]);

    return {
      summaries,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const weeklySummaryService = new WeeklySummaryService();
