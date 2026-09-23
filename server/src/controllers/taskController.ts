import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskRepository } from '../services/storage/repository.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const createTaskSchema = z.object({
  teamId: z.string().optional(),
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  sourceMeetingId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigneeName: z.string().optional(),
  dueDate: z.string().optional(),
});

export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await TaskRepository.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await TaskRepository.findAll();
    res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const task = await TaskRepository.update(id, req.body);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};
