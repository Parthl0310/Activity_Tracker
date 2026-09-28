import { Request, Response, NextFunction } from 'express';
import { activitiesService } from './activities.service.js';

export class ActivitiesController {
  public async enrichPreview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await activitiesService.enrichPreview(
        req.user!.userId,
        req.body.text,
        req.body.project
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const activity = await activitiesService.createActivity(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Activity recorded successfully',
        data: { activity },
      });
    } catch (error) {
      next(error);
    }
  }

  public async listActivities(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await activitiesService.listActivities(
        req.user!.userId,
        req.query as any
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const activity = await activitiesService.getActivityById(
        req.user!.userId,
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: { activity },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const activity = await activitiesService.updateActivity(
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Activity updated successfully',
        data: { activity },
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await activitiesService.deleteActivity(req.user!.userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Activity deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async improveEntry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const suggestion = await activitiesService.improveEntry(
        req.user!.userId,
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: suggestion,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const activitiesController = new ActivitiesController();
