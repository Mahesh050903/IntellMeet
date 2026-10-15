import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  refreshToken,
  getMe,
  requestLoginOtp,
  requestRegisterOtp,
  verifyOtp,
  resendOtp,
  updateProfile,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshSchema,
  requestLoginOtpSchema,
  requestRegisterOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
  updateProfileSchema,
  requestForgotPasswordOtp,
  resetPassword,
  requestForgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/authController.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

router.post('/login-otp-request', validateRequest(requestLoginOtpSchema), requestLoginOtp);
router.post('/register-otp-request', validateRequest(requestRegisterOtpSchema), requestRegisterOtp);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validateRequest(resendOtpSchema), resendOtp);

router.post('/forgot-password-request', validateRequest(requestForgotPasswordSchema), requestForgotPasswordOtp);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

router.post('/google', validateRequest(googleAuthSchema), googleAuth);

router.post('/refresh', validateRequest(refreshSchema), refreshToken);
router.get('/users/me', authenticate, getMe);
router.put('/profile', authenticate, validateRequest(updateProfileSchema), updateProfile);

export default router;
