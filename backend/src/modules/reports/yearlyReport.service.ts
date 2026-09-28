import mongoose from 'mongoose';
import {
  YearlyReport,
  IYearlyReport,
  IYearlyReportContent,
  ReportSectionName,
} from '../../models/YearlyReport.js';
import { MonthlySummary } from '../../models/MonthlySummary.js';
import { Activity } from '../../models/Activity.js';
import { AchievedGoal } from '../../models/AchievedGoal.js';
import { AppError } from '../../middleware/error.middleware.js';
import {
  generateYearlyReport as aiGenerateYearlyReport,
  generateSingleReportSection,
  ReportSectionName as AiReportSectionName,
} from '@activity-tracker/ai';

const SECTION_TO_AI_MAP: Partial<Record<ReportSectionName, AiReportSectionName>> = {
  executiveSummary: 'Executive Summary',
  majorContributions: 'Major Contributions',
  technicalWork: 'Technical Work',
  skillsDemonstrated: 'Skills Demonstrated',
  projects: 'Projects',
  learningAndDevelopment: 'Learning and Development',
};

export interface ReportAvailability {
  year: number;
  hasEnoughData: boolean;
  activityCount: number;
  monthlySummaryCount: number;
  achievedGoalCount: number;
  canGenerate: boolean;
}

export class YearlyReportService {
  public async checkAvailability(
    userId: string,
    year: number
  ): Promise<ReportAvailability> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const [activityCount, monthlySummaryCount, achievedGoalCount] =
      await Promise.all([
        Activity.countDocuments({
          userId: userObjectId,
          workDate: { $gte: yearStart, $lte: yearEnd },
        }),
        MonthlySummary.countDocuments({
          userId: userObjectId,
          year,
        }),
        AchievedGoal.countDocuments({
          userId: userObjectId,
          completedAt: { $gte: yearStart, $lte: yearEnd },
        }),
      ]);

    const canGenerate = activityCount > 0 || monthlySummaryCount > 0;

    return {
      year,
      hasEnoughData: activityCount >= 10 || monthlySummaryCount >= 2,
      activityCount,
      monthlySummaryCount,
      achievedGoalCount,
      canGenerate,
    };
  }

  private formatOrSynthesizeAchievedGoals(
    goals: any[],
    monthlySummaries: any[],
    activities: any[],
    year: number
  ): string {
    if (goals && goals.length > 0) {
      return goals
        .map((g, idx) => {
          let entry = `${idx + 1}. ${g.title}`;
          if (g.project) entry += ` [Project: ${g.project}]`;
          if (g.impactScore) entry += ` [Impact: ${g.impactScore}%]`;
          if (g.description) entry += `\n   Summary: ${g.description}`;
          if (g.keyOutcomes && g.keyOutcomes.length > 0) {
            entry += `\n   Key Deliverables: ${g.keyOutcomes.join('; ')}`;
          }
          return entry;
        })
        .join('\n\n');
    }

    // Synthesize milestone achievements dynamically from main flow (monthlySummaries & activities)
    const milestones: string[] = [];

    const allWorkAreas = Array.from(
      new Set(monthlySummaries.flatMap((m: any) => m.summary?.majorWorkAreas || []).filter(Boolean))
    );
    const distinctProjects = Array.from(
      new Set(activities.map((a: any) => a.project).filter(Boolean))
    );

    if (allWorkAreas.length > 0 || distinctProjects.length > 0) {
      const projectsList = distinctProjects.slice(0, 4).join(', ');
      const areasList = allWorkAreas.slice(0, 4).join(', ');
      milestones.push(
        `1. Core Milestone Deliverables across Key Systems: Successfully developed and delivered critical components for ${projectsList || 'key engineering platforms'}${areasList ? `, advancing initiatives in ${areasList}` : ''}.`
      );
    }

    const highImpactActs = activities.filter(
      (a: any) =>
        a.workType === 'Feature' ||
        a.workType === 'Architecture' ||
        a.workType === 'Optimization' ||
        (a.category && a.category.toLowerCase().includes('feature'))
    );

    if (highImpactActs.length > 0) {
      const sampleFeatures = highImpactActs
        .slice(0, 3)
        .map((a: any) => a.aiRefinedText || a.text)
        .join('; ');
      milestones.push(
        `2. High-Impact Technical Execution & Feature Rollouts: Architected and deployed key functional enhancements including: ${sampleFeatures}.`
      );
    } else if (activities.length > 0) {
      const sampleActs = activities
        .slice(0, 3)
        .map((a: any) => a.aiRefinedText || a.text)
        .join('; ');
      milestones.push(
        `2. Consistent Delivery & Sprint Commitments: Executed and verified planned development milestones including: ${sampleActs}.`
      );
    }

    milestones.push(
      `3. Quality, Reliability & Observability Milestones: Maintained high code quality standards, zero-regression release cycles, and active adherence to engineering SLAs throughout ${year}.`
    );

    return milestones.join('\n\n');
  }

  public async generateReport(
    userId: string,
    year: number,
    forceNewVersion: boolean = false
  ): Promise<IYearlyReport> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Fetch data sources
    const [monthlySummaries, activities, goals] = await Promise.all([
      MonthlySummary.find({ userId: userObjectId, year }).sort({ month: 1 }),
      Activity.find({
        userId: userObjectId,
        workDate: { $gte: yearStart, $lte: yearEnd },
      }),
      AchievedGoal.find({
        userId: userObjectId,
        completedAt: { $gte: yearStart, $lte: yearEnd },
      }),
    ]);

    const cleanActivities = activities.map(a => ({
      date: a.workDate,
      project: a.project,
      category: a.category,
      workType: a.workType,
      text: a.text,
      aiRefinedText: a.aiRefinedText,
      skills: a.skills,
      keywords: a.keywords
    }));

    const cleanSummaries = monthlySummaries.map(m => ({
      month: m.month,
      summary: m.summary?.aiSummary || '',
      projects: m.summary?.majorWorkAreas || [],
      skills: m.summary?.skillsDemonstrated || []
    }));

    const cleanGoals = goals.map(g => ({ 
      title: g.title, 
      description: g.description, 
      date: g.completedAt 
    }));

    const generatedSections = await aiGenerateYearlyReport(userId, year, cleanActivities, cleanSummaries, cleanGoals);

    const reportContent: IYearlyReportContent = {
      executiveSummary: generatedSections['Executive Summary'].sectionText,
      majorContributions: generatedSections['Major Contributions'].sectionText,
      technicalWork: generatedSections['Technical Work'].sectionText,
      skillsDemonstrated: generatedSections['Skills Demonstrated'].sectionText,
      projects: generatedSections['Projects'].sectionText,
      learningAndDevelopment: generatedSections['Learning and Development'].sectionText,
      achievedGoals: this.formatOrSynthesizeAchievedGoals(goals, monthlySummaries, activities, year),
      overallYearSummary: `Overall, ${year} was characterized by consistent output, solid technical execution, and measurable contributions across all key milestones.`,
    };

    // Find if draft exists or create new version
    const latestVersionDoc = await YearlyReport.findOne({
      userId: userObjectId,
      year,
    }).sort({ version: -1 });

    if (!forceNewVersion && latestVersionDoc && latestVersionDoc.status === 'draft') {
      latestVersionDoc.report = reportContent;
      await latestVersionDoc.save();
      return latestVersionDoc;
    }

    const nextVersion = latestVersionDoc ? latestVersionDoc.version + 1 : 1;

    const newReport = await YearlyReport.create({
      userId: userObjectId,
      year,
      report: reportContent,
      version: nextVersion,
      status: 'draft',
    });

    return newReport;
  }

  public async getReport(
    userId: string,
    year: number,
    version?: number
  ): Promise<IYearlyReport> {
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      year,
    };
    if (version !== undefined && !isNaN(version)) {
      query.version = version;
    }

    const report = await YearlyReport.findOne(query).sort({ version: -1 });

    if (!report) {
      throw new AppError(`No yearly report found for year ${year}${version ? ` (version ${version})` : ''}`, 404);
    }

    return report;
  }

  public async editSection(
    userId: string,
    year: number,
    sectionName: ReportSectionName,
    content: string,
    version?: number
  ): Promise<IYearlyReport> {
    const report = await this.getReport(userId, year, version);

    if (report.status === 'final') {
      throw new AppError('Cannot edit a finalized report. Please unlock the report or generate a new draft revision.', 400);
    }

    report.report[sectionName] = content;
    await report.save();
    return report;
  }

  public async regenerateSection(
    userId: string,
    year: number,
    sectionName: ReportSectionName,
    version?: number
  ): Promise<IYearlyReport> {
    const report = await this.getReport(userId, year, version);

    if (report.status === 'final') {
      throw new AppError('Cannot regenerate section on a finalized report. Please unlock the report first.', 400);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    if (sectionName === 'achievedGoals') {
      const [monthlySummaries, activities, goals] = await Promise.all([
        MonthlySummary.find({ userId: userObjectId, year }).sort({ month: 1 }),
        Activity.find({
          userId: userObjectId,
          workDate: { $gte: yearStart, $lte: yearEnd },
        }),
        AchievedGoal.find({
          userId: userObjectId,
          completedAt: { $gte: yearStart, $lte: yearEnd },
        }),
      ]);

      report.report.achievedGoals = this.formatOrSynthesizeAchievedGoals(
        goals,
        monthlySummaries,
        activities,
        year
      );
      await report.save();
      return report;
    }

    if (sectionName === 'overallYearSummary') {
      report.report.overallYearSummary = `Overall, ${year} was characterized by consistent output, solid technical execution, and measurable contributions across all key milestones.`;
      await report.save();
      return report;
    }

    const aiSectionName = SECTION_TO_AI_MAP[sectionName];
    if (!aiSectionName) {
      throw new AppError(`Unknown section '${sectionName}' for regeneration`, 400);
    }

    // Refresh data and regenerate that section using RAG
    const [monthlySummaries, activities, goals] = await Promise.all([
      MonthlySummary.find({ userId: userObjectId, year }).sort({ month: 1 }),
      Activity.find({
        userId: userObjectId,
        workDate: { $gte: yearStart, $lte: yearEnd },
      }),
      AchievedGoal.find({
        userId: userObjectId,
        completedAt: { $gte: yearStart, $lte: yearEnd },
      }),
    ]);

    const cleanActivities = activities.map(a => ({
      date: a.workDate,
      project: a.project,
      category: a.category,
      workType: a.workType,
      text: a.text,
      aiRefinedText: a.aiRefinedText,
      skills: a.skills,
      keywords: a.keywords,
    }));

    const cleanSummaries = monthlySummaries.map(m => ({
      month: m.month,
      summary: m.summary?.aiSummary || '',
      projects: m.summary?.majorWorkAreas || [],
      skills: m.summary?.skillsDemonstrated || [],
    }));

    const cleanGoals = goals.map(g => ({
      title: g.title,
      description: g.description,
      date: g.completedAt,
    }));

    const singleSection = await generateSingleReportSection(
      userId,
      year,
      aiSectionName,
      cleanGoals,
      { activities: cleanActivities, monthlySummaries: cleanSummaries }
    );

    report.report[sectionName] = singleSection.sectionText;
    await report.save();
    return report;
  }

  public async finalizeReport(
    userId: string,
    year: number,
    version?: number
  ): Promise<IYearlyReport> {
    const report = await this.getReport(userId, year, version);

    if (report.status === 'final') {
      return report;
    }

    report.status = 'final';
    await report.save();
    return report;
  }

  public async unlockReport(
    userId: string,
    year: number,
    version?: number
  ): Promise<IYearlyReport> {
    const report = await this.getReport(userId, year, version);

    if (report.status === 'draft') {
      return report;
    }

    report.status = 'draft';
    await report.save();
    return report;
  }

  public async mergeReports(
    userId: string,
    year: number,
    mergedContent: IYearlyReportContent
  ): Promise<IYearlyReport> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const latestVersionDoc = await YearlyReport.findOne({
      userId: userObjectId,
      year,
    }).sort({ version: -1 });

    const nextVersion = latestVersionDoc ? latestVersionDoc.version + 1 : 1;

    const mergedReport = await YearlyReport.create({
      userId: userObjectId,
      year,
      report: mergedContent,
      version: nextVersion,
      status: 'draft',
    });

    return mergedReport;
  }

  public async listReportVersions(
    userId: string,
    year: number
  ): Promise<IYearlyReport[]> {
    const versions = await YearlyReport.find({
      userId: new mongoose.Types.ObjectId(userId),
      year,
    }).sort({ version: -1 });

    return versions;
  }

  public async deleteReportVersion(
    userId: string,
    year: number,
    version?: number
  ): Promise<{ message: string; remainingVersions: number; latestVersion?: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const query: any = { userId: userObjectId, year };
    if (version !== undefined && !isNaN(version)) {
      query.version = version;
    }

    const reportToDelete = await YearlyReport.findOne(query).sort({ version: -1 });

    if (!reportToDelete) {
      throw new AppError(`Report draft version ${version || 'latest'} not found for year ${year}`, 404);
    }

    if (reportToDelete.status === 'final') {
      throw new AppError(
        `Cannot delete report Version ${reportToDelete.version} because it is locked and finalized. Please unlock the report first if you wish to delete it.`,
        400
      );
    }

    await YearlyReport.deleteOne({ _id: reportToDelete._id });

    // Fetch latest remaining version if any
    const latestRemaining = await YearlyReport.findOne({ userId: userObjectId, year }).sort({ version: -1 });
    const remainingCount = await YearlyReport.countDocuments({ userId: userObjectId, year });

    return {
      message: `Report draft Version ${reportToDelete.version} deleted successfully`,
      remainingVersions: remainingCount,
      latestVersion: latestRemaining ? latestRemaining.version : undefined,
    };
  }
}

export const yearlyReportService = new YearlyReportService();
