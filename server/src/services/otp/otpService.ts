export interface PendingOtp {
  email: string;
  code: string;
  expiresAt: number;
  purpose: 'login' | 'register';
  registrationData?: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'admin' | 'member' | 'guest';
    avatar?: string;
  };
}

class OtpManager {
  private store: Map<string, PendingOtp> = new Map();

  private getKey(email: string, purpose: 'login' | 'register'): string {
    return `${email.toLowerCase().trim()}_${purpose}`;
  }

  public createOtp(
    email: string,
    purpose: 'login' | 'register',
    registrationData?: PendingOtp['registrationData']
  ): string {
    const key = this.getKey(email, purpose);
    // Secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    this.store.set(key, {
      email: email.toLowerCase().trim(),
      code,
      expiresAt,
      purpose,
      registrationData,
    });

    return code;
  }

  public verifyOtp(
    email: string,
    code: string,
    purpose: 'login' | 'register'
  ): { valid: boolean; error?: string; registrationData?: PendingOtp['registrationData'] } {
    const key = this.getKey(email, purpose);
    const entry = this.store.get(key);

    if (!entry) {
      return { valid: false, error: 'No verification code found. Please request a new OTP.' };
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return { valid: false, error: 'Verification code has expired. Please request a new OTP.' };
    }

    if (entry.code !== code.trim()) {
      return { valid: false, error: 'Incorrect verification code. Please check and try again.' };
    }

    // Code is valid! Consume it
    const data = entry.registrationData;
    this.store.delete(key);
    return { valid: true, registrationData: data };
  }

  public getPending(email: string, purpose: 'login' | 'register'): PendingOtp | null {
    const key = this.getKey(email, purpose);
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }
}

export const OtpService = new OtpManager();
