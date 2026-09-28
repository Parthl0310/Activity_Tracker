import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { config } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { SignupInput, LoginInput } from './auth.dto.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: any;
  tokens: AuthTokens;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  private generateTokens(user: IUser): AuthTokens {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as any,
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: any, refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const decoded = jwt.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await RefreshToken.create({
      userId,
      tokenHash,
      revoked: false,
      expiresAt,
    });
  }

  public async signup(input: SignupInput): Promise<AuthResult> {
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      reviewYear: new Date().getFullYear(),
      skills: [],
      currentProjects: [],
      profileCompleted: false,
    });

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  public async login(input: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  public async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    if (!rawRefreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(rawRefreshToken, config.jwt.refreshSecret) as {
        userId: string;
        email: string;
      };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await RefreshToken.findOne({
      tokenHash,
      userId: decoded.userId,
      revoked: false,
    });

    if (!storedToken) {
      throw new AppError('Refresh token has been revoked or is invalid', 401);
    }

    // Revoke old refresh token for rotation
    storedToken.revoked = true;
    await storedToken.save();

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Issue new pair
    const newTokens = this.generateTokens(user);
    await this.saveRefreshToken(user._id, newTokens.refreshToken);

    return newTokens;
  }

  public async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      const tokenHash = hashToken(rawRefreshToken.trim());
      await RefreshToken.updateMany({ tokenHash }, { $set: { revoked: true } });
    }
  }
}

export const authService = new AuthService();
