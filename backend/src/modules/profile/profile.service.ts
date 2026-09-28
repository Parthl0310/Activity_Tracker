import { User, IUser } from '../../models/User.js';
import { AppError } from '../../middleware/error.middleware.js';
import { SetupProfileInput, UpdateProfileInput } from './profile.dto.js';

export class ProfileService {
  public async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404);
    }
    if (!user.profileCompleted && (user.jobRole || user.department)) {
      user.profileCompleted = true;
      await user.save();
    }
    return user;
  }

  public async setupProfile(userId: string, input: SetupProfileInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404);
    }

    if (input.name) user.name = input.name;
    user.jobRole = input.jobRole;
    user.department = input.department;
    if (input.reviewYear) user.reviewYear = input.reviewYear;
    if (input.skills) user.skills = input.skills;
    if (input.currentProjects) user.currentProjects = input.currentProjects;
    if (input.joiningDate) user.joiningDate = new Date(input.joiningDate);
    if (input.professionalBackground !== undefined) user.professionalBackground = input.professionalBackground;

    user.profileCompleted = true;

    await user.save();
    return user;
  }

  public async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404);
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.jobRole !== undefined) user.jobRole = input.jobRole;
    if (input.department !== undefined) user.department = input.department;
    if (input.reviewYear !== undefined) user.reviewYear = input.reviewYear;
    if (input.skills !== undefined) user.skills = input.skills;
    if (input.currentProjects !== undefined) user.currentProjects = input.currentProjects;
    if (input.joiningDate !== undefined) user.joiningDate = new Date(input.joiningDate);
    if (input.professionalBackground !== undefined) user.professionalBackground = input.professionalBackground;

    if (input.jobRole || user.jobRole || input.department || user.department) {
      user.profileCompleted = true;
    }

    await user.save();
    return user;
  }
}

export const profileService = new ProfileService();
