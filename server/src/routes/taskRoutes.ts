import { Router } from 'express';
import { createTask, getTasks, updateTask, createTaskSchema, updateTaskSchema } from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createTaskSchema), createTask);
router.get('/', getTasks);
router.patch('/:id', validateRequest(updateTaskSchema), updateTask);

export default router;
