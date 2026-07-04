import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Set VITE_API_URL for tests
import.meta.env.VITE_API_URL = 'http://localhost:8000';

// Now import the module under test
import {
  login,
  register,
  logout,
  getMe,
  setToken,
  clearToken,
  getToken,
  getAuthHeaders,
  isAuthenticated,
  deleteAccount,
  claimGuestDocuments,
} from '../auth';

describe('auth lib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockReset();
  });

  // ── Token management ──

  describe('token management', () => {
    it('setToken stores the token', () => {
      setToken('test-token');
      expect(localStorage.getItem('auth_token')).toBe('test-token');
    });

    it('clearToken removes the token', () => {
      setToken('test-token');
      clearToken();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('getToken returns the stored token', () => {
      setToken('test-token');
      expect(getToken()).toBe('test-token');
    });

    it('getToken returns null when no token', () => {
      expect(getToken()).toBeNull();
    });
  });

  // ── Auth headers ──

  describe('getAuthHeaders', () => {
    it('includes Authorization header when token exists', () => {
      setToken('test-token');
      const headers = getAuthHeaders();
      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('does not include Authorization when no token', () => {
      const headers = getAuthHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  // ── login ──

  describe('login', () => {
    it('sends POST to /auth/jwt/login with form data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token123', token_type: 'bearer' }),
      });

      const result = await login({ email: 'user@test.com', password: 'pass' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/jwt/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      expect(result.access_token).toBe('token123');
    });

    it('throws on login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' }),
      });

      await expect(login({ email: 'bad@test.com', password: 'wrong' })).rejects.toThrow('Invalid credentials');
    });
  });

  // ── register ──

  describe('register', () => {
    it('sends POST to /auth/register', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', email: 'new@test.com', is_active: true, is_superuser: false, is_verified: false, created_at: '' }),
      });

      const result = await register({ email: 'new@test.com', password: 'pass' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'new@test.com', password: 'pass' }),
        })
      );
      expect(result.email).toBe('new@test.com');
    });

    it('handles registration errors with detail array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: [{ msg: 'Email already registered' }] }),
      });

      await expect(register({ email: 'dup@test.com', password: 'pass' })).rejects.toThrow('Email already registered');
    });
  });

  // ── logout ──

  describe('logout', () => {
    it('sends POST to /auth/jwt/logout', async () => {
      setToken('test-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await logout();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/jwt/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  // ── getMe ──

  describe('getMe', () => {
    it('sends GET to /users/me with auth header', async () => {
      setToken('test-token');
      const userData = { id: '1', email: 'user@test.com', is_active: true, is_superuser: false, is_verified: false, created_at: '' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => userData,
      });

      const result = await getMe();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result.email).toBe('user@test.com');
    });

    it('throws "Not authenticated" on 401', async () => {
      setToken('invalid-token');
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

      await expect(getMe()).rejects.toThrow('Not authenticated');
    });
  });

  // ── isAuthenticated ──

  describe('isAuthenticated', () => {
    it('returns true when getMe succeeds', async () => {
      setToken('valid-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', email: 'u@t.com', is_active: true, is_superuser: false, is_verified: false, created_at: '' }),
      });

      const result = await isAuthenticated();
      expect(result).toBe(true);
    });

    it('returns false and clears token when getMe fails', async () => {
      setToken('bad-token');
      mockFetch.mockRejectedValueOnce(new Error('Unauthorized'));

      const result = await isAuthenticated();
      expect(result).toBe(false);
      expect(getToken()).toBeNull();
    });

    it('returns false when no token exists', async () => {
      const result = await isAuthenticated();
      expect(result).toBe(false);
    });
  });

  // ── deleteAccount ──

  describe('deleteAccount', () => {
    it('sends DELETE to /auth/me', async () => {
      setToken('test-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await deleteAccount();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/me',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });

    it('throws on delete failure', async () => {
      setToken('test-token');
      mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Delete failed' }) });

      await expect(deleteAccount()).rejects.toThrow('Delete failed');
    });
  });

  // ── claimGuestDocuments ──

  describe('claimGuestDocuments', () => {
    it('sends POST to /auth/claim-guest-docs with guest ID header', async () => {
      setToken('auth-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success' }) });

      await claimGuestDocuments('guest-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/claim-guest-docs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer auth-token',
            'X-Guest-ID': 'guest-123',
          }),
        })
      );
    });
  });
});