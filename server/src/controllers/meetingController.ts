import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { MeetingRepository, MessageRepository } from '../services/storage/repository.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const createMeetingSchema = z.object({
  title: z.string().min(2, 'Meeting title is required'),
  teamId: z.string().optional(),
  passCode: z.string().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(2).optional(),
  status: z.enum(['scheduled', 'active', 'ended', 'cancelled']).optional(),
  recordingUrl: z.string().optional(),
});

export const createMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, teamId, passCode } = req.body;
    const hostId = req.user?.userId || 'anonymous';
    const hostName = req.user?.name || 'Anonymous User';

    const meeting = await MeetingRepository.create({
      title,
      teamId,
      hostId,
      hostName,
      status: 'active',
      participants: [{ userId: hostId, name: hostName, joinedAt: new Date() }],
    });

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: { meeting },
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const meetings = await MeetingRepository.findAll();
    res.status(200).json({
      success: true,
      data: { meetings },
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const meeting = await MeetingRepository.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { meeting },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await MeetingRepository.update(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: { meeting: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await MeetingRepository.delete(id);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted or cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const messages = await MessageRepository.findByMeetingId(id);

    res.status(200).json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    next(error);
  }
};
