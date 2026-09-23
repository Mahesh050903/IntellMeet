const API_BASE = '/api';

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

    const data: ApiResponse<T> = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network request failed',
    };
  }
};
