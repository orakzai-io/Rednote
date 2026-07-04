import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock useAuth
const mockLogin = vi.fn();
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    register: vi.fn(),
    logout: vi.fn(),
    deleteAccount: vi.fn(),
  }),
}));

import { LoginPage } from '../LoginPage';

describe('LoginPage', () => {
  const onSwitchToRegister = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    render(<LoginPage onSwitchToRegister={onSwitchToRegister} />);

    expect(screen.getByText('REDNOTE')).toBeTruthy();
    expect(screen.getByText('Sign in to access your notebook')).toBeTruthy();
    expect(screen.getByLabelText('Email Address')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
    expect(screen.getByText('Create one')).toBeTruthy();
  });

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginPage onSwitchToRegister={onSwitchToRegister} />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();

    render(<LoginPage onSwitchToRegister={onSwitchToRegister} />);

    await user.type(screen.getByLabelText('Email Address'), 'bad@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('calls onSwitchToRegister when clicking "Create one"', async () => {
    const user = userEvent.setup();
    render(<LoginPage onSwitchToRegister={onSwitchToRegister} />);

    await user.click(screen.getByText('Create one'));

    expect(onSwitchToRegister).toHaveBeenCalledOnce();
  });

  it('calls onCancel when login succeeds and onCancel is provided', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginPage onSwitchToRegister={onSwitchToRegister} onCancel={onCancel} />);

    await user.type(screen.getByLabelText('Email Address'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'pass1234');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalled();
    });
  });

  it('shows "Continue as Guest" button when onCancel is provided', () => {
    render(<LoginPage onSwitchToRegister={onSwitchToRegister} onCancel={onCancel} />);
    expect(screen.getByText('Continue as Guest')).toBeTruthy();
  });

  it('does not show "Continue as Guest" when onCancel is not provided', () => {
    render(<LoginPage onSwitchToRegister={onSwitchToRegister} />);
    expect(screen.queryByText('Continue as Guest')).toBeNull();
  });
});