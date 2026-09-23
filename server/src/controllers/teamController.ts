import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name is required'),
  memberIds: z.array(z.string()).optional(),
});

export const createTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, memberIds } = req.body;
    const ownerId = req.user?.userId || 'unknown';

    const team = {
      id: 'team_' + Math.random().toString(36).substring(2, 9),
      name,
      ownerId,
      memberIds: memberIds || [ownerId],
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: { team },
    });
  } catch (error) {
    next(error);
  }
};
