import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the auth lib
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockGetMe = vi.fn();
const mockSetToken = vi.fn();
const mockClearToken = vi.fn();
const mockGetToken = vi.fn();
const mockClaimGuestDocuments = vi.fn();
const mockDeleteAccount = vi.fn();

vi.mock('../../lib/auth', () => ({
  login: (...args: any[]) => mockLogin(...args),
  register: (...args: any[]) => mockRegister(...args),
  logout: (...args: any[]) => mockLogout(...args),
  getMe: (...args: any[]) => mockGetMe(...args),
  setToken: (...args: any[]) => mockSetToken(...args),
  clearToken: (...args: any[]) => mockClearToken(...args),
  getToken: (...args: any[]) => mockGetToken(...args),
  claimGuestDocuments: (...args: any[]) => mockClaimGuestDocuments(...args),
  deleteAccount: (...args: any[]) => mockDeleteAccount(...args),
}));

// Mock crypto.randomUUID for guest ID
const mockUUID = '00000000-0000-0000-0000-000000000000';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID),
});

import { AuthProvider, AuthContext } from '../AuthContext';

// Helper component to test context values
function TestConsumer() {
  const ctx = React.useContext(AuthContext);
  return (
    <div>
      <span data-testid="is-auth">{String(ctx.isAuthenticated)}</span>
      <span data-testid="is-loading">{String(ctx.isLoading)}</span>
      <span data-testid="user">{ctx.user ? ctx.user.email : 'null'}</span>
      <button data-testid="btn-login" onClick={() => ctx.login({ email: 'a@b.com', password: 'p' })}>
        Login
      </button>
      <button data-testid="btn-register" onClick={() => ctx.register({ email: 'a@b.com', password: 'p' })}>
        Register
      </button>
      <button data-testid="btn-logout" onClick={() => ctx.logout()}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default: no token stored, getMe not called
    mockGetToken.mockReturnValue(null);
  });

  it('shows loading initially then resolves to unauthenticated', async () => {
    mockGetToken.mockReturnValue(null);
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // After useEffect runs, loading should resolve to false and user should be unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
      expect(screen.getByTestId('is-auth').textContent).toBe('false');
    });
  });

  it('restores session when token exists and getMe succeeds', async () => {
    mockGetToken.mockReturnValue('valid-token');
    const userData = {
      id: '1',
      email: 'user@test.com',
      is_active: true,
      is_superuser: false,
      is_verified: false,
      created_at: '',
    };
    mockGetMe.mockResolvedValue(userData);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@test.com');
      expect(screen.getByTestId('is-auth').textContent).toBe('true');
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });
  });

  it('clears token and sets unauthenticated when getMe fails', async () => {
    mockGetToken.mockReturnValue('invalid-token');
    mockGetMe.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('is-auth').textContent).toBe('false');
      expect(mockClearToken).toHaveBeenCalled();
    });
  });
});