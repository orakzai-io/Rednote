import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { UserInfo, LoginPayload, RegisterPayload } from '../types';
import { login as apiLogin, register as apiRegister, logout as apiLogout, deleteAccount as apiDeleteAccount, claimGuestDocuments as apiClaimGuestDocuments, getMe, setToken, clearToken, getToken } from '../lib/auth';

interface AuthContextValue {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount, and initialize guest ID
  useEffect(() => {
    // Generate guest ID if not exists
    if (!localStorage.getItem('guest_id')) {
      localStorage.setItem('guest_id', crypto.randomUUID());
    }

    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        setUser(userData);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiLogin(payload);
    setToken(response.access_token);
    
    // Claim guest documents if guest_id exists
    const guestId = localStorage.getItem('guest_id');
    if (guestId) {
      try {
        await apiClaimGuestDocuments(guestId);
        localStorage.removeItem('guest_id');
      } catch (err) {
        console.error("Failed to claim guest documents during login:", err);
      }
    }
    
    const userData = await getMe();
    setUser(userData);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const userData = await apiRegister(payload);
    // Auto-login after registration
    const response = await apiLogin({
      email: payload.email,
      password: payload.password,
    });
    setToken(response.access_token);
    
    // Claim guest documents if guest_id exists
    const guestId = localStorage.getItem('guest_id');
    if (guestId) {
      try {
        await apiClaimGuestDocuments(guestId);
        localStorage.removeItem('guest_id');
      } catch (err) {
        console.error("Failed to claim guest documents during registration:", err);
      }
    }
    
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Clear locally even if server request fails
    }
    clearToken();
    setUser(null);
    
    // Re-initialize guest ID on logout so they can chat as a guest again
    if (!localStorage.getItem('guest_id')) {
      localStorage.setItem('guest_id', crypto.randomUUID());
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    clearToken();
    setUser(null);
    
    // Re-initialize guest ID on account delete
    if (!localStorage.getItem('guest_id')) {
      localStorage.setItem('guest_id', crypto.randomUUID());
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
