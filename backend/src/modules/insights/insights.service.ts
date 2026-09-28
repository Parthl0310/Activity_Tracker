import mongoose from 'mongoose';
import { Activity } from '../../models/Activity.js';
import { AchievedGoal } from '../../models/AchievedGoal.js';
import { MonthlySummary } from '../../models/MonthlySummary.js';
import { generateInsights as aiGenerateInsights } from '@activity-tracker/ai';

export interface MonthlyHistogramItem {
  month: number;
  monthName: string;
  count: number;
}

export interface MetricCount {
  name: string;
  count: number;
}

export interface YearlyOverviewResponse {
  year: number;
  totalActivities: number;
  totalAchievedGoals: number;
  monthlyHistogram: MonthlyHistogramItem[];
  topSkills: MetricCount[];
  categoryDistribution: MetricCount[];
  workTypeDistribution: MetricCount[];
  projectDistribution: MetricCount[];
}

export interface AIInsightsResponse {
  year: number;
  strongestWorkArea: string;
  mostActiveProject: string;
  topDemonstratedSkill: string;
  learningPattern: string;
  workPatternSummary: string;
  confidenceScore: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export class InsightsService {
  public async getYearlyOverview(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<YearlyOverviewResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const matchFilter = {
      userId: userObjectId,
      workDate: { $gte: yearStart, $lte: yearEnd },
    };

    // Run parallel aggregation pipelines
    const [
      histogramRaw,
      topSkillsRaw,
      categoryRaw,
      workTypeRaw,
      projectsRaw,
      totalGoals,
    ] = await Promise.all([
      // 1. Monthly Histogram
      Activity.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $month: '$workDate' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 2. Top Skills
      Activity.aggregate([
        { $match: matchFilter },
        { $unwind: '$skills' },
        {
          $group: {
            _id: '$skills',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // 3. Category Distribution
      Activity.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $ifNull: ['$category', 'Uncategorized'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 4. Work Type Distribution
      Activity.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $ifNull: ['$workType', 'Technical'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 5. Project Breakdown
      Activity.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              $cond: [
                { $or: [{ $eq: ['$project', ''] }, { $not: ['$project'] }] },
                'General / Miscellaneous',
                '$project',
              ],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // 6. Achieved goals count for the year
      AchievedGoal.countDocuments({
        userId: userObjectId,
        completedAt: { $gte: yearStart, $lte: yearEnd },
      }),
    ]);

    // Map month histogram to ensure all 12 months exist
    const monthlyMap = new Map<number, number>();
    histogramRaw.forEach((item: { _id: number; count: number }) => {
      monthlyMap.set(item._id, item.count);
    });

    const monthlyHistogram: MonthlyHistogramItem[] = Array.from(
      { length: 12 },
      (_, idx) => {
        const monthNum = idx + 1;
        return {
          month: monthNum,
          monthName: MONTH_NAMES[idx],
          count: monthlyMap.get(monthNum) || 0,
        };
      }
    );

    const totalActivities = monthlyHistogram.reduce(
      (acc, curr) => acc + curr.count,
      0
    );

    return {
      year,
      totalActivities,
      totalAchievedGoals: totalGoals,
      monthlyHistogram,
      topSkills: topSkillsRaw.map((s) => ({ name: s._id, count: s.count })),
      categoryDistribution: categoryRaw.map((c) => ({
        name: c._id,
        count: c.count,
      })),
      workTypeDistribution: workTypeRaw.map((w) => ({
        name: w._id,
        count: w.count,
      })),
      projectDistribution: projectsRaw.map((p) => ({
        name: p._id,
        count: p.count,
      })),
    };
  }

  public async getAIInsights(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<AIInsightsResponse> {
    const overview = await this.getYearlyOverview(userId, year);

    let aiInsightsResponse = {
      strongestWorkArea: overview.categoryDistribution[0]?.name || 'Fullstack Engineering',
      mostActiveProject: overview.projectDistribution[0]?.name || 'Core Services',
      topDemonstratedSkill: overview.topSkills[0]?.name || 'TypeScript & Distributed Systems',
      learningPattern: `Consistent technical output focused on delivery with continuous on-the-job skill reinforcement.`,
      workPatternSummary: `No activity records logged yet for ${year}. Start logging daily work entries to generate AI synthesis.`,
    };

    if (overview.totalActivities > 0) {
      const monthlySummaries = await MonthlySummary.find({ userId: new mongoose.Types.ObjectId(userId), year });
      
      const frequencyTable = {
        monthlyHistogram: overview.monthlyHistogram,
        topSkills: overview.topSkills,
        categoryDistribution: overview.categoryDistribution,
        workTypeDistribution: overview.workTypeDistribution,
        projectDistribution: overview.projectDistribution,
      };

      const generated = await aiGenerateInsights(userId, year, monthlySummaries, frequencyTable);
      
      aiInsightsResponse = {
        strongestWorkArea: generated.strongestWorkArea,
        mostActiveProject: generated.mostActiveProject,
        topDemonstratedSkill: generated.mostDemonstratedSkills.join(', ') || 'TypeScript',
        learningPattern: generated.learningPattern,
        workPatternSummary: generated.workPattern,
      };
    }

    return {
      year,
      ...aiInsightsResponse,
      confidenceScore: overview.totalActivities > 5 ? 0.94 : 0.65,
    };
  }
}

export const insightsService = new InsightsService();
