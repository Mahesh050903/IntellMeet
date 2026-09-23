import { Router } from 'express';
import { register, login, refreshToken, getMe, registerSchema, loginSchema, refreshSchema } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshSchema), refreshToken);
router.get('/users/me', authenticate, getMe);

export default router;
