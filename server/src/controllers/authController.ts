import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRepository } from '../services/storage/repository.js';
import { generateTokens, verifyRefreshToken } from '../utils/token.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { OtpService } from '../services/otp/otpService.js';
import { EmailService } from '../services/email/emailService.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'member', 'guest']).optional(),
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const requestLoginOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const requestRegisterOtpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'member', 'guest']).optional(),
  avatar: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  purpose: z.enum(['login', 'register', 'forgot-password']),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z.enum(['login', 'register', 'forgot-password']),
});

export const requestForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar: z.string().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export const googleAuthSchema = z.object({
  credential: z.string().optional(),
  userProfile: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
    googleId: z.string().min(1, 'Google ID is required'),
    avatar: z.string().optional(),
  }).optional(),
}).refine((data) => data.credential || data.userProfile, {
  message: 'Either Google credential or userProfile is required',
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserRepository.create({
      name,
      email,
      passwordHash,
      role: role || 'member',
    });

    const tokens = generateTokens({
      userId: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const tokens = generateTokens({
      userId: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const verified = verifyRefreshToken(refreshToken);

    if (!verified) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    const user = await UserRepository.findById(verified.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    const tokens = generateTokens({
      userId: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await UserRepository.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: user.authProvider || 'local',
          twoFactorEnabled: user.twoFactorEnabled !== false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, userProfile } = req.body;

    let googleUser: { email: string; name: string; googleId: string; avatar?: string } | null = null;

    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (verifyRes.ok) {
          const payload: any = await verifyRes.json();
          if (payload && payload.email) {
            googleUser = {
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              googleId: payload.sub,
              avatar: payload.picture,
            };
          }
        }
      } catch (err) {
        console.warn('[Google Auth] Failed to verify token online:', err);
      }
    }

    if (!googleUser && userProfile) {
      googleUser = userProfile;
    }

    if (!googleUser) {
      return res.status(400).json({
        success: false,
        error: 'Failed to verify Google credentials',
      });
    }

    // 1. Try finding user by googleId
    let user = await UserRepository.findByGoogleId(googleUser.googleId);

    // 2. If not found by googleId, check if an account with this email already exists
    if (!user) {
      user = await UserRepository.findByEmail(googleUser.email);
      if (user) {
        // Link Google ID and update avatar
        await UserRepository.updateGoogleId(
          user._id?.toString() || user.id,
          googleUser.googleId,
          user.avatar || googleUser.avatar
        );
      } else {
        // Create new user with Google profile
        user = await UserRepository.create({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          authProvider: 'google',
          role: 'member',
        });
      }
    }

    const tokens = generateTokens({
      userId: user._id?.toString() || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user._id?.toString() || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || googleUser.avatar,
          authProvider: user.authProvider || 'google',
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const requestLoginOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: 'This account was registered via Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // If user disabled 2FA, log in immediately without OTP
    if (user.twoFactorEnabled === false) {
      const tokens = generateTokens({
        userId: user._id?.toString() || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          twoFactorBypassed: true,
          user: {
            id: user._id?.toString() || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            authProvider: user.authProvider || 'local',
            twoFactorEnabled: false,
          },
          tokens,
        },
      });
    }

    const otp = OtpService.createOtp(email, 'login');
    const emailResult = await EmailService.sendOtpEmail(email, otp, 'login');

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email address',
      data: {
        email,
        purpose: 'login',
        delivered: emailResult.delivered,
        devOtp: emailResult.devOtp,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const requestRegisterOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const otp = OtpService.createOtp(email, 'register', {
      name,
      email,
      passwordHash,
      role: role || 'member',
      avatar,
    });

    const emailResult = await EmailService.sendOtpEmail(email, otp, 'register');

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email address',
      data: {
        email,
        purpose: 'register',
        delivered: emailResult.delivered,
        devOtp: emailResult.devOtp,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, purpose } = req.body;

    const result = OtpService.verifyOtp(email, otp, purpose);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Invalid verification code',
      });
    }

    if (purpose === 'login') {
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const tokens = generateTokens({
        userId: user._id?.toString() || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: {
            id: user._id?.toString() || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            authProvider: user.authProvider || 'local',
          },
          tokens,
        },
      });
    } else {
      const regData = result.registrationData;
      if (!regData) {
        return res.status(400).json({
          success: false,
          error: 'Registration details expired. Please register again.',
        });
      }

      const user = await UserRepository.create({
        name: regData.name,
        email: regData.email,
        passwordHash: regData.passwordHash,
        role: regData.role || 'member',
        avatar: regData.avatar,
        authProvider: 'local',
      });

      const tokens = generateTokens({
        userId: user._id?.toString() || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: {
            id: user._id?.toString() || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            authProvider: 'local',
          },
          tokens,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, purpose } = req.body;

    const pending = OtpService.getPending(email, purpose);
    if (!pending) {
      return res.status(400).json({
        success: false,
        error: 'No active verification session found. Please try submitting again.',
      });
    }

    const otp = OtpService.createOtp(email, purpose, pending.registrationData);
    const emailResult = await EmailService.sendOtpEmail(email, otp, purpose);

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent',
      data: {
        email,
        purpose,
        delivered: emailResult.delivered,
        devOtp: emailResult.devOtp,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, avatar, twoFactorEnabled } = req.body;
    const updatedUser = await UserRepository.updateProfile(req.user.userId, {
      name,
      avatar,
      twoFactorEnabled,
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id?.toString() || updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          authProvider: updatedUser.authProvider || 'local',
          twoFactorEnabled: updatedUser.twoFactorEnabled !== false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const requestForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account registered with this email address.',
      });
    }

    const otp = OtpService.createOtp(email, 'forgot-password');
    const emailResult = await EmailService.sendOtpEmail(email, otp, 'forgot-password');

    return res.status(200).json({
      success: true,
      message: 'Password reset verification code has been sent to your email.',
      data: {
        email,
        purpose: 'forgot-password',
        delivered: emailResult.delivered,
        devOtp: emailResult.devOtp,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = OtpService.verifyOtp(email, otp, 'forgot-password');
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Invalid or expired verification code.',
      });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Account not found.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await UserRepository.updatePassword(user._id?.toString() || user.id, passwordHash);

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};


