import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { MeetingRepository, SummaryRepository, TaskRepository } from '../services/storage/repository.js';
import { AIService } from '../services/ai/aiService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const generateSummarySchema = z.object({
  transcript: z.string().min(5, 'Transcript text or audio transcription is required'),
});

export const generateMeetingSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;

    const meeting = await MeetingRepository.findById(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    const aiResult = await AIService.generateSummaryAndActionItems(meeting.title, transcript);

    const savedSummary = await SummaryRepository.saveSummary({
      meetingId: id,
      executiveSummary: aiResult.executiveSummary,
      keyPoints: aiResult.keyPoints,
      decisions: aiResult.decisions,
      actionItems: aiResult.actionItems,
    });

    res.status(200).json({
      success: true,
      message: 'AI summary and action items extracted successfully',
      data: {
        summary: savedSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingActionItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const summary = await SummaryRepository.findByMeetingId(id);

    if (!summary) {
      return res.status(200).json({
        success: true,
        data: { actionItems: [] },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        actionItems: summary.actionItems || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
