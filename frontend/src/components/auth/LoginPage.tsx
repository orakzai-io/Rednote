import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onCancel?: () => void;
}

export function LoginPage({ onSwitchToRegister, onCancel }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ email, password });
      if (onCancel) onCancel(); // Close auth screen on successful login
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              margin: '0 0 8px 0',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}
          >
            RED<span style={{ color: 'var(--red-accent)' }}>NOTE</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Sign in to access your notebook
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(230, 0, 18, 0.06)',
              border: '1px solid var(--red-accent)',
              color: 'var(--text-primary)',
              padding: '12px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--red-accent)';
                e.target.style.boxShadow = '0 0 8px var(--red-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--red-accent)';
                e.target.style.boxShadow = '0 0 8px var(--red-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '11px',
              backgroundColor: isSubmitting ? 'rgba(230, 0, 18, 0.5)' : 'var(--red-accent)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'var(--red-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'var(--red-accent)';
              }
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Switch to Register */}
        <p
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            margin: '24px 0 0 0',
          }}
        >
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--red-accent)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--red-accent)'; }}
          >
            Create one
          </button>
        </p>

        {onCancel && (
          <p
            style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '0.85rem',
              margin: '16px 0 0 0',
            }}
          >
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Continue as Guest
            </button>
          </p>
        )}
      </div>
    </div>
  );
}