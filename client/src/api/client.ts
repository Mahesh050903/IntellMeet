export const DEFAULT_BACKEND_URL = 'https://intellmeet-backend-fbp8.onrender.com';
const rawApiUrl = (import.meta as any).env?.VITE_API_URL || DEFAULT_BACKEND_URL;
const API_BASE = ((rawApiUrl && rawApiUrl.trim() ? rawApiUrl : DEFAULT_BACKEND_URL).replace(/\/$/, '')) + '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const getStoredToken = () => localStorage.getItem('intellmeet_token');
export const setStoredToken = (token: string) => localStorage.setItem('intellmeet_token', token);
export const removeStoredToken = () => localStorage.removeItem('intellmeet_token');

export const getStoredUser = () => {
  const user = localStorage.getItem('intellmeet_user');
  return user ? JSON.parse(user) : null;
};
export const setStoredUser = (user: any) => localStorage.setItem('intellmeet_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('intellmeet_user');

export const apiFetch = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data: ApiResponse<T> = await res.json();
      return data;
    }

    const text = await res.text();
    if (!res.ok) {
      return {
        success: false,
        error: `Server responded with ${res.status}: ${res.statusText || 'Service Unavailable'}. Please wait a moment for the server to wake up.`,
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: text || 'Invalid response from server',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network request failed. Please check your internet connection.',
    };
  }
};
