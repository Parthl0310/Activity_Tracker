import mongoose from 'mongoose';
import { MonthlySummary, IMonthlySummary } from '../../models/MonthlySummary.js';
import { WeeklySummary } from '../../models/WeeklySummary.js';
import { Activity } from '../../models/Activity.js';
import { AppError } from '../../middleware/error.middleware.js';
import { EditMonthlySummaryInput } from './summaries.dto.js';
import { generateMonthlySummary as aiGenerateMonthlySummary, chunkText, embedBatch, upsertVector, deleteVectors } from '@activity-tracker/ai';

export class MonthlySummaryService {
  public async getMonthlySummary(
    userId: string,
    month: number,
    year: number
  ): Promise<IMonthlySummary> {
    const summary = await MonthlySummary.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      month,
      year,
    }).populate({
      path: 'sourceWeekIds',
      select: 'weekStart weekEnd summary.entryCount summary.aiInsight',
    });

    if (!summary) {
      throw new AppError('Monthly summary not found for specified month and year', 404);
    }

    return summary;
  }

  public async generateMonthlySummary(
    userId: string,
    month: number,
    year: number
  ): Promise<IMonthlySummary> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch weeks overlapping with this month
    const weeklySummaries = await WeeklySummary.find({
      userId: userObjectId,
      weekStart: { $gte: monthStart, $lte: monthEnd },
    });

    // 2. Fetch raw activities for this month
    const activities = await Activity.find({
      userId: userObjectId,
      workDate: { $gte: monthStart, $lte: monthEnd },
    });

    const entryCount = activities.length;

    let skillsDemonstrated: string[] = [];
    let majorWorkAreas: string[] = [];
    let aiSummary = `No logged activities recorded for ${month}/${year}.`;

    if (entryCount > 0) {
      // If weekly summaries exist, synthesize from weekly summaries;
      // If no weekly summaries were generated yet, synthesize from the logged activities directly!
      const contextData = weeklySummaries.length > 0
        ? weeklySummaries.map(w => ({
            weekStart: w.weekStart.toISOString(),
            weekEnd: w.weekEnd.toISOString(),
            majorWork: w.summary.majorWork,
            technicalAreas: w.summary.technicalAreas,
            aiInsight: w.summary.aiInsight
          }))
        : activities.map(a => ({
            date: a.workDate.toISOString(),
            text: a.aiRefinedText || a.text,
            project: a.project || 'General',
            category: a.category || 'General',
            skills: a.skills || []
          }));

      try {
        const aiResponse = await aiGenerateMonthlySummary(
          userId,
          month,
          year,
          contextData
        );
        skillsDemonstrated = aiResponse.skillsDemonstrated || [];
        majorWorkAreas = aiResponse.majorWorkAreas || [];
        aiSummary = aiResponse.aiSummary || '';
      } catch (err: any) {
        console.warn(`[Monthly Summary] LLM generation warning (${err.message}). Using activity synthesis fallback.`);
        const detectedSkills = Array.from(new Set(activities.flatMap(a => a.skills || []))).filter(Boolean);
        const detectedProjects = Array.from(new Set(activities.map(a => a.project || '').filter(Boolean)));
        skillsDemonstrated = detectedSkills.length > 0 ? detectedSkills : ['Software Engineering', 'System Development'];
        majorWorkAreas = detectedProjects.length > 0
          ? detectedProjects.map(p => `Delivered key engineering deliverables and technical milestones for ${p}`)
          : activities.slice(0, 5).map(a => a.aiRefinedText || a.text);
        aiSummary = `During ${month}/${year}, completed ${entryCount} recorded work activities across ${majorWorkAreas.length} key initiative(s).`;
      }
    }

    // Generate monthly summary chunks for vector embedding / RAG storage
    const rawChunks = [
      { type: 'technical' as const, text: `Technical focus for ${month}/${year}: Skills utilized: ${skillsDemonstrated.join(', ')}.` },
      { type: 'contribution' as const, text: `Initiatives delivered across: ${majorWorkAreas.join(', ')} with ${entryCount} recorded commits/milestones.` },
      { type: 'general' as const, text: aiSummary },
    ];

    const chunks: { chunkId: string; chunkType: 'technical' | 'contribution' | 'learning' | 'project' | 'general'; chunkText: string }[] = [];
    try {
      // Clean up previous vector chunks for this month if regenerating
      const existingSummary = await MonthlySummary.findOne({ userId: userObjectId, month, year });
      if (existingSummary && existingSummary.chunks && existingSummary.chunks.length > 0) {
        const oldIds = existingSummary.chunks.map(c => c.chunkId).filter(Boolean);
        await deleteVectors('monthly-summary-chunks', oldIds);
      }

      for (const raw of rawChunks) {
        const chunkedTexts = chunkText(raw.text, 256);
        if (chunkedTexts.length > 0) {
          const embeddings = await embedBatch(chunkedTexts);
          for (let i = 0; i < chunkedTexts.length; i++) {
            const chunkId = `${userId}-${year}-${month}-${raw.type}-${i}`;
            await upsertVector('monthly-summary-chunks', chunkId, embeddings[i], {
              userId: userId.toString(),
              year,
              month,
              chunkId,
              chunkType: raw.type,
              chunkText: chunkedTexts[i],
            });
            chunks.push({
              chunkId,
              chunkType: raw.type,
              chunkText: chunkedTexts[i],
            });
          }
        }
      }
    } catch (pineconeErr: any) {
      console.warn(`[Pinecone] Monthly summary indexing warning:`, pineconeErr.message);
      // Ensure chunks are still saved locally even if vector indexing is unavailable
      for (const raw of rawChunks) {
        const chunkedTexts = chunkText(raw.text, 256);
        chunkedTexts.forEach((ct, i) => {
          chunks.push({
            chunkId: `${userId}-${year}-${month}-${raw.type}-${i}`,
            chunkType: raw.type,
            chunkText: ct,
          });
        });
      }
    }


    const summaryDoc = await MonthlySummary.findOneAndUpdate(
      { userId: userObjectId, month, year },
      {
        summary: {
          majorWorkAreas,
          skillsDemonstrated,
          aiSummary,
          entryCount,
        },
        sourceWeekIds: weeklySummaries.map((w) => w._id),
        chunks,
        confidenceScore: entryCount >= 5 ? 0.95 : 0.75,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return summaryDoc;
  }

  public async regenerateMonthlySummary(
    userId: string,
    summaryId: string
  ): Promise<IMonthlySummary> {
    const existing = await MonthlySummary.findOne({
      _id: summaryId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existing) {
      throw new AppError('Monthly summary not found', 404);
    }

    return this.generateMonthlySummary(userId, existing.month, existing.year);
  }

  public async editMonthlySummary(
    userId: string,
    summaryId: string,
    input: EditMonthlySummaryInput
  ): Promise<IMonthlySummary> {
    const summary = await MonthlySummary.findOne({
      _id: summaryId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!summary) {
      throw new AppError('Monthly summary not found', 404);
    }

    if (input.majorWorkAreas !== undefined)
      summary.summary.majorWorkAreas = input.majorWorkAreas;
    if (input.skillsDemonstrated !== undefined)
      summary.summary.skillsDemonstrated = input.skillsDemonstrated;
    if (input.aiSummary !== undefined) summary.summary.aiSummary = input.aiSummary;

    await summary.save();
    return summary;
  }

  public async listMonthlySummaries(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ summaries: IMonthlySummary[]; total: number; page: number; totalPages: number }> {
    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    const skip = (page - 1) * limit;

    const [summaries, total] = await Promise.all([
      MonthlySummary.find(filter)
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit),
      MonthlySummary.countDocuments(filter),
    ]);

    return {
      summaries,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async deleteMonthlySummary(
    userId: string,
    month: number,
    year: number
  ): Promise<{ message: string }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const existing = await MonthlySummary.findOne({ userId: userObjectId, month, year });
    if (!existing) {
      throw new AppError(`Monthly summary not found for ${month}/${year}`, 404);
    }

    if (existing.chunks && existing.chunks.length > 0) {
      try {
        const oldIds = existing.chunks.map((c: any) => c.chunkId).filter(Boolean);
        await deleteVectors('monthly-summary-chunks', oldIds);
      } catch (e: any) {
        console.warn(`[Pinecone] Warning deleting monthly vectors:`, e.message);
      }
    }

    await MonthlySummary.deleteOne({ _id: existing._id });
    return { message: `Monthly summary for ${month}/${year} deleted successfully` };
  }
}

export const monthlySummaryService = new MonthlySummaryService();
