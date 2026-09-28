import { Request, Response, NextFunction } from 'express';
import { weeklySummaryService } from './weeklySummary.service.js';
import { monthlySummaryService } from './monthlySummary.service.js';

export class SummariesController {
  // Weekly Handlers
  public async getWeeklySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const weekStart = new Date(req.query.weekStart as string);
      const summary = await weeklySummaryService.getWeeklySummary(
        req.user!.userId,
        weekStart
      );
      res.status(200).json({ success: true, data: { summary } });
    } catch (error) {
      next(error);
    }
  }

  public async generateWeeklySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await weeklySummaryService.generateWeeklySummary(
        req.user!.userId,
        req.body.weekStart,
        req.body.weekEnd
      );
      res.status(200).json({
        success: true,
        message: 'Weekly summary generated successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  public async regenerateWeeklySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await weeklySummaryService.regenerateWeeklySummary(
        req.user!.userId,
        req.params.id
      );
      res.status(200).json({
        success: true,
        message: 'Weekly summary regenerated successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  public async editWeeklySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await weeklySummaryService.editWeeklySummary(
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Weekly summary updated successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  public async listWeeklySummaries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await weeklySummaryService.listWeeklySummaries(
        req.user!.userId,
        page,
        limit
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Monthly Handlers
  public async getMonthlySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const month = parseInt(req.query.month as string, 10);
      const year = parseInt(req.query.year as string, 10);

      const summary = await monthlySummaryService.getMonthlySummary(
        req.user!.userId,
        month,
        year
      );
      res.status(200).json({ success: true, data: { summary } });
    } catch (error) {
      next(error);
    }
  }

  public async generateMonthlySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await monthlySummaryService.generateMonthlySummary(
        req.user!.userId,
        req.body.month,
        req.body.year
      );
      res.status(200).json({
        success: true,
        message: 'Monthly summary generated successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  public async regenerateMonthlySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await monthlySummaryService.regenerateMonthlySummary(
        req.user!.userId,
        req.params.id
      );
      res.status(200).json({
        success: true,
        message: 'Monthly summary regenerated successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  public async editMonthlySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await monthlySummaryService.editMonthlySummary(
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Monthly summary updated successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }

  public async listMonthlySummaries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await monthlySummaryService.listMonthlySummaries(
        req.user!.userId,
        page,
        limit
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public async deleteMonthlySummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const month = parseInt((req.query.month || req.body.month) as string, 10);
      const year = parseInt((req.query.year || req.body.year) as string, 10);

      const result = await monthlySummaryService.deleteMonthlySummary(
        req.user!.userId,
        month,
        year
      );
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

export const summariesController = new SummariesController();
