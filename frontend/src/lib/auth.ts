import type { UserInfo, LoginPayload, RegisterPayload, AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const guestId = localStorage.getItem('guest_id');
  if (guestId) {
    headers['X-Guest-ID'] = guestId;
  }
  return headers;
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('auth_token');
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const formData = new URLSearchParams();
  formData.append('username', payload.email);
  formData.append('password', payload.password);

  const res = await fetch(`${API_URL}/auth/jwt/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Login failed (${res.status})`);
  }

  return res.json();
}

export async function register(payload: RegisterPayload): Promise<UserInfo> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail?.[0]?.msg || errData.detail || `Registration failed (${res.status})`);
  }

  return res.json();
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/jwt/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Logout failed (${res.status})`);
  }
}

export async function getMe(): Promise<UserInfo> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error('Not authenticated');
  }

  return res.json();
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to delete account');
  }
}

export async function claimGuestDocuments(guestId: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/claim-guest-docs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      'X-Guest-ID': guestId,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to claim guest documents.');
  }
}


export async function isAuthenticated(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    await getMe();
    return true;
  } catch {
    clearToken();
    return false;
  }
}