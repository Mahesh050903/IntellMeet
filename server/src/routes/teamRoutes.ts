import { Router } from 'express';
import { createTeam, createTeamSchema } from '../controllers/teamController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);
router.post('/', validateRequest(createTeamSchema), createTeam);

export default router;
