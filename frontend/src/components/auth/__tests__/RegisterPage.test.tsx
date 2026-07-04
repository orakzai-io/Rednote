import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock useAuth
const mockRegister = vi.fn();
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    deleteAccount: vi.fn(),
  }),
}));

import { RegisterPage } from '../RegisterPage';

describe('RegisterPage', () => {
  const onSwitchToLogin = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the registration form', () => {
    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} />);

    expect(screen.getByText('REDNOTE')).toBeTruthy();
    expect(screen.getByText('Create an account to start')).toBeTruthy();
    expect(screen.getByLabelText('Email Address')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /create account/i })).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('calls register on form submit', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} />);

    await user.type(screen.getByLabelText('Email Address'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();

    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();

    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Password must be at least 8 characters long.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('displays error message on registration failure', async () => {
    mockRegister.mockRejectedValue(new Error('Email already registered'));
    const user = userEvent.setup();

    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} />);

    await user.type(screen.getByLabelText('Email Address'), 'existing@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeTruthy();
    });
  });

  it('calls onSwitchToLogin when clicking "Sign in"', async () => {
    const user = userEvent.setup();
    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} />);

    await user.click(screen.getByText('Sign in'));

    expect(onSwitchToLogin).toHaveBeenCalledOnce();
  });

  it('calls onCancel when registration succeeds', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} onCancel={onCancel} />);

    await user.type(screen.getByLabelText('Email Address'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalled();
    });
  });

  it('shows "Continue as Guest" button when onCancel is provided', () => {
    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} onCancel={onCancel} />);
    expect(screen.getByText('Continue as Guest')).toBeTruthy();
  });

  it('does not show "Continue as Guest" when onCancel is not provided', () => {
    render(<RegisterPage onSwitchToLogin={onSwitchToLogin} />);
    expect(screen.queryByText('Continue as Guest')).toBeNull();
  });
});