import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getMeetingMessages,
  createMeetingSchema,
  updateMeetingSchema,
} from '../controllers/meetingController.js';
import { generateMeetingSummary, getMeetingActionItems, generateSummarySchema } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createMeetingSchema), createMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingById);
router.patch('/:id', validateRequest(updateMeetingSchema), updateMeeting);
router.delete('/:id', deleteMeeting);

router.get('/:id/messages', getMeetingMessages);
router.post('/:id/ai-summary', validateRequest(generateSummarySchema), generateMeetingSummary);
router.get('/:id/action-items', getMeetingActionItems);

export default router;
