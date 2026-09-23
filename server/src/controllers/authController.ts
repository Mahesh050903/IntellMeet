import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRepository } from '../services/storage/repository.js';
import { generateTokens, verifyRefreshToken } from '../utils/token.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'member', 'guest']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserRepository.create({
      name,
      email,
      passwordHash,
      role: role || 'member',
    });

    const tokens = generateTokens({
      userId: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const tokens = generateTokens({
      userId: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const verified = verifyRefreshToken(refreshToken);

    if (!verified) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    const user = await UserRepository.findById(verified.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    const tokens = generateTokens({
      userId: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await UserRepository.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
