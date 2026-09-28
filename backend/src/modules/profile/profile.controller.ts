import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service.js';

export class ProfileController {
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await profileService.getProfile(req.user!.userId);
      res.status(200).json({
        success: true,
        data: { profile: user },
      });
    } catch (error) {
      next(error);
    }
  }

  public async setupProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await profileService.setupProfile(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile setup completed successfully',
        data: { profile: user },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await profileService.updateProfile(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { profile: user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
