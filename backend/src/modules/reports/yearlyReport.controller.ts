import { Request, Response, NextFunction } from 'express';
import { yearlyReportService } from './yearlyReport.service.js';
import { ReportSectionName } from '../../models/YearlyReport.js';

export class YearlyReportController {
  public async checkAvailability(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const result = await yearlyReportService.checkAvailability(
        req.user!.userId,
        year
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async generateReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const forceNewVersion = req.body?.forceNewVersion === true;
      const report = await yearlyReportService.generateReport(
        req.user!.userId,
        year,
        forceNewVersion
      );
      res.status(201).json({
        success: true,
        message: 'Yearly performance report generated successfully',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  public async getReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const version = req.query.version
        ? parseInt(req.query.version as string, 10)
        : undefined;
      const report = await yearlyReportService.getReport(
        req.user!.userId,
        year,
        version
      );
      res.status(200).json({ success: true, data: { report } });
    } catch (error) {
      next(error);
    }
  }

  public async editSection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const sectionName = req.params.name as ReportSectionName;
      const version = req.query.version
        ? parseInt(req.query.version as string, 10)
        : undefined;
      const report = await yearlyReportService.editSection(
        req.user!.userId,
        year,
        sectionName,
        req.body.content,
        version
      );
      res.status(200).json({
        success: true,
        message: `Section '${sectionName}' updated successfully`,
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  public async regenerateSection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const sectionName = req.params.name as ReportSectionName;
      const version = req.query.version
        ? parseInt(req.query.version as string, 10)
        : undefined;
      const report = await yearlyReportService.regenerateSection(
        req.user!.userId,
        year,
        sectionName,
        version
      );
      res.status(200).json({
        success: true,
        message: `Section '${sectionName}' regenerated successfully`,
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  public async finalizeReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const version = (req.body?.version || req.query?.version)
        ? parseInt((req.body?.version || req.query?.version) as string, 10)
        : undefined;
      const report = await yearlyReportService.finalizeReport(
        req.user!.userId,
        year,
        version
      );
      res.status(200).json({
        success: true,
        message: 'Yearly performance report finalized and archived',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  public async unlockReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const version = (req.body?.version || req.query?.version)
        ? parseInt((req.body?.version || req.query?.version) as string, 10)
        : undefined;
      const report = await yearlyReportService.unlockReport(
        req.user!.userId,
        year,
        version
      );
      res.status(200).json({
        success: true,
        message: 'Yearly performance report unlocked for editing',
        data: { report },
      });
    } catch (error) {
      next(error);
    }
  }

  public async mergeReports(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const mergedReport = await yearlyReportService.mergeReports(
        req.user!.userId,
        year,
        req.body.report
      );
      res.status(201).json({
        success: true,
        message: 'Reports merged successfully into new version',
        data: { report: mergedReport },
      });
    } catch (error) {
      next(error);
    }
  }

  public async listReportVersions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const versions = await yearlyReportService.listReportVersions(
        req.user!.userId,
        year
      );
      res.status(200).json({
        success: true,
        data: { versions },
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteReportVersion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      const version = (req.query.version || req.params.version)
        ? parseInt((req.query.version || req.params.version) as string, 10)
        : undefined;
      const result = await yearlyReportService.deleteReportVersion(
        req.user!.userId,
        year,
        version
      );
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const yearlyReportController = new YearlyReportController();
