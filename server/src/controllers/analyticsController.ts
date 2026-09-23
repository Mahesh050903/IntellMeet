import { Response, NextFunction } from 'express';
import { MeetingRepository, TaskRepository } from '../services/storage/repository.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const meetings = await MeetingRepository.findAll();
    const tasks = await TaskRepository.findAll();

    const activeMeetings = meetings.filter((m) => m.status === 'active').length;
    const completedMeetings = meetings.filter((m) => m.status === 'ended').length;

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
    const todoTasks = tasks.filter((t) => t.status === 'todo').length;

    const totalParticipants = meetings.reduce((acc, m) => acc + (m.participants?.length || 1), 0);

    res.status(200).json({
      success: true,
      data: {
        meetings: {
          total: meetings.length,
          active: activeMeetings,
          completed: completedMeetings,
          totalParticipants,
        },
        tasks: {
          total: totalTasks,
          done: doneTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        },
        aiSummariesGenerated: meetings.length, // meetings eligible
      },
    });
  } catch (error) {
    next(error);
  }
};
