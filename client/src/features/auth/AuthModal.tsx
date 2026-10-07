import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, setStoredToken, setStoredUser } from '../../api/client.js';
import {
  Video,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Key,
  ExternalLink,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
  Clock
} from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: any) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [avatar, setAvatar] = useState<string>('');
  
  // OTP Verification State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Real Google Client ID from environment or user-configured localStorage
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const [activeClientId, setActiveClientId] = useState<string>(
    envClientId || localStorage.getItem('intellmeet_google_client_id') || ''
  );
  const [inputClientId, setInputClientId] = useState<string>(activeClientId);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (isOtpStep && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpStep, otpTimer]);

  // Handle Photo/PNG File Selection (Max 500 KB)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, or WebP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE_BYTES = 500 * 1024; // 500 KB limit
    if (file.size > MAX_SIZE_BYTES) {
      const sizeDisplay = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      setError(`⚠️ Image size (${sizeDisplay}) 500 KB se jyada hai! Kripya 500 KB se kam size ki photo ya PNG upload karein.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Initialize official Google Identity Services
  useEffect(() => {
    if (!activeClientId) return;

    const checkAndInit = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: activeClientId,
            callback: async (response: any) => {
              if (response.credential) {
                await processGoogleAuth({ credential: response.credential });
              }
            },
            auto_select: false,
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 368,
            });
          }
        } catch (err) {
          console.warn('Google Identity Services initialization:', err);
        }
      }
    };

    checkAndInit();
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        checkAndInit();
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [activeClientId]);

  const processGoogleAuth = async (payload: {
    credential?: string;
    userProfile?: { email: string; name: string; googleId: string; avatar?: string };
  }) => {
    setError(null);
    setGoogleLoading(true);

    try {
      const res = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        setError(res.error || 'Google authentication failed');
        setGoogleLoading(false);
        return;
      }

      setStoredToken(res.data.tokens.accessToken);
      setStoredUser(res.data.user);
      onSuccess(res.data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google authentication');
    } finally {
      setGoogleLoading(false);
      setShowSetupModal(false);
    }
  };

  // Submit credentials and send OTP to user's email
  const handleInitiateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register-otp-request' : '/auth/login-otp-request';
      const payload = isRegister
        ? { name, email, password, role, avatar }
        : { email, password };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        setError(res.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      // Switch to OTP Verification Step
      setIsOtpStep(true);
      setOtpCode('');
      setOtpTimer(60);
      setCanResend(false);
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      } else {
        setDevOtpHint(null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Verify submitted 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp: otpCode.trim(),
          purpose: isRegister ? 'register' : 'login',
        }),
      });

      if (!res.success) {
        setError(res.error || 'Invalid verification code');
        setLoading(false);
        return;
      }

      setStoredToken(res.data.tokens.accessToken);
      setStoredUser(res.data.user);
      onSuccess(res.data.user);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP to email
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          purpose: isRegister ? 'register' : 'login',
        }),
      });

      if (!res.success) {
        setError(res.error || 'Failed to resend code');
        setLoading(false);
        return;
      }

      setOtpTimer(60);
      setCanResend(false);
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputClientId.trim();
    if (!trimmed) return;
    localStorage.setItem('intellmeet_google_client_id', trimmed);
    setActiveClientId(trimmed);
    setShowSetupModal(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(10, 13, 20, 0.95) 75%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 100,
      overflowY: 'auto',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        maxHeight: '94vh',
        overflowY: 'auto',
        padding: isRegister ? '22px 28px' : '32px 36px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15)',
        margin: 'auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: isRegister ? '12px' : '18px' }}>
          <div style={{
            width: isRegister ? '44px' : '52px',
            height: isRegister ? '44px' : '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: isRegister ? '8px' : '12px',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
          }}>
            <Video size={isRegister ? 24 : 28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: isRegister ? '1.4rem' : '1.55rem', fontWeight: 700, textAlign: 'center', color: '#f8fafc' }}>
            {isOtpStep
              ? 'Email Verification'
              : isRegister
              ? 'Create Your Account'
              : 'Welcome to IntellMeet'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: isRegister ? '0.8rem' : '0.86rem', textAlign: 'center', marginTop: '3px' }}>
            {isOtpStep
              ? `Enter the 6-digit verification code sent to ${email}`
              : isRegister
              ? 'Upload your photo & join collaborative workspaces'
              : 'Sign in to access AI-powered meetings and workspaces'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f87171',
            fontSize: '0.84rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {isOtpStep && devOtpHint && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#34d399',
            fontSize: '0.82rem',
          }}>
            <span>Local/Dev Mode OTP: <b>{devOtpHint}</b></span>
            <button
              type="button"
              onClick={() => setOtpCode(devOtpHint)}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: 'none',
                color: '#10b981',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Auto-fill
            </button>
          </div>
        )}

        {isOtpStep ? (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 500, textAlign: 'center' }}>
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  fontSize: '1.8rem',
                  letterSpacing: '10px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  padding: '10px',
                  background: '#13151c',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '10px',
                  color: '#818cf8',
                  fontWeight: 700,
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                <Clock size={14} />
                <span>{canResend ? 'Code expired' : `Expires in ${otpTimer}s`}</span>
              </div>
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={handleResendOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: canResend ? '#818cf8' : '#64748b',
                  cursor: canResend ? 'pointer' : 'default',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px',
                }}
              >
                <RefreshCw size={12} />
                <span>Resend OTP</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="btn-primary"
              style={{
                padding: '11px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.92rem',
                width: '100%',
              }}
            >
              {loading ? 'Verifying...' : (
                <>
                  <span>Verify & Enter Workspace</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOtpStep(false);
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '4px',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Edit Email / Password</span>
            </button>
          </form>
        ) : (
          <>
            <div style={{ marginBottom: '18px' }}>
              <div
                ref={googleBtnContainerRef}
                style={{
                  width: '100%',
                  minHeight: activeClientId ? '44px' : '0px',
                  display: activeClientId ? 'flex' : 'none',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              />

              {(!activeClientId || googleLoading) && (
                <button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  disabled={googleLoading}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '11px 16px',
                    background: '#ffffff',
                    color: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                >
                  {googleLoading ? (
                    <span>Signing in with Google...</span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.35 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: isRegister ? '10px' : '16px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.09)' }} />
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', fontWeight: 600 }}>
                or sign in with email & OTP
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.09)' }} />
            </div>

            <div style={{
              display: 'flex',
              background: '#16181e',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: isRegister ? '12px' : '18px',
            }}>
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                style={{
                  flex: 1,
                  padding: '7px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !isRegister ? '#10b981' : 'transparent',
                  color: !isRegister ? '#042f1a' : '#a1a1aa',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                style={{
                  flex: 1,
                  padding: '7px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isRegister ? '#10b981' : 'transparent',
                  color: isRegister ? '#042f1a' : '#a1a1aa',
                  transition: 'all 0.15s ease',
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleInitiateAuth} style={{ display: 'flex', flexDirection: 'column', gap: isRegister ? '10px' : '14px' }}>
              {isRegister && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  marginBottom: '2px',
                }}>
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: '#1e212b',
                      border: '2px solid #10b981',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                    }}>
                      {avatar ? (
                        <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Camera size={22} color="#94a3b8" />
                      )}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #161820',
                    }}>
                      <Upload size={10} color="#042f1a" />
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                  />

                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#34d399',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      {avatar ? 'Change Photo (Max 500 KB)' : 'Upload Profile Photo (Max 500 KB)'}
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          marginLeft: '8px',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Presets:</span>
                    {PRESET_AVATARS.map((presetUrl, idx) => (
                      <img
                        key={idx}
                        src={presetUrl}
                        alt={`Preset ${idx + 1}`}
                        onClick={() => setAvatar(presetUrl)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: avatar === presetUrl ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'transform 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isRegister && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: showPassword ? '#818cf8' : '#64748b',
                      borderRadius: '6px',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                    Enterprise Role
                  </label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="member">Team Member</option>
                    <option value="admin">Administrator / Lead</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="btn-primary"
                style={{
                  padding: '11px',
                  borderRadius: '8px',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.92rem',
                  width: '100%',
                }}
              >
                {loading ? 'Sending Code...' : (
                  <>
                    <span>{isRegister ? 'Continue & Verify Email' : 'Send OTP & Sign In'}</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

      </div>

      {showSetupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            position: 'relative',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          }}>
            <button
              onClick={() => setShowSetupModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Key size={20} color="#818cf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  Real Google Sign-In Setup
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Connect your Google Cloud OAuth 2.0 Client ID
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveClientId}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Enter your Google Client ID:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                value={inputClientId}
                onChange={(e) => setInputClientId(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.82rem',
                  padding: '9px 12px',
                  marginBottom: '14px',
                }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                  }}
                >
                  Save & Enable Google Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
