import { Request, Response, NextFunction } from 'express';
import { insightsService } from './insights.service.js';

export class InsightsController {
  public async getYearlyOverview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = req.query.year
        ? parseInt(req.query.year as string, 10)
        : new Date().getFullYear();

      const overview = await insightsService.getYearlyOverview(
        req.user!.userId,
        year
      );

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAIInsights(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const year = req.query.year
        ? parseInt(req.query.year as string, 10)
        : new Date().getFullYear();

      const insights = await insightsService.getAIInsights(
        req.user!.userId,
        year
      );

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const insightsController = new InsightsController();
