import { Request, Response, NextFunction } from 'express';
import { achievedGoalsService } from './achievedGoals.service.js';

export class AchievedGoalsController {
  public async createGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const goal = await achievedGoalsService.createGoal(
        req.user!.userId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Achieved goal created successfully',
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  public async listGoals(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await achievedGoalsService.listGoals(
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

  public async getGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const goal = await achievedGoalsService.getGoalById(
        req.user!.userId,
        req.params.id
      );
      res.status(200).json({
        success: true,
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const goal = await achievedGoalsService.updateGoal(
        req.user!.userId,
        req.params.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Achieved goal updated successfully',
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await achievedGoalsService.deleteGoal(req.user!.userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Achieved goal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async linkActivities(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const goal = await achievedGoalsService.linkActivities(
        req.user!.userId,
        req.params.id,
        req.body.activityIds
      );
      res.status(200).json({
        success: true,
        message: 'Activities linked to goal successfully',
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const achievedGoalsController = new AchievedGoalsController();
