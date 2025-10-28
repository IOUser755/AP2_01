import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';

import { authService } from '@services/authService';
import type { Tenant, User } from '@types/auth';
import type { AuthResponse } from '@services/authService';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tenant: Tenant } }
  | { type: 'AUTH_FAILURE'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_TENANT'; payload: Partial<Tenant> }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        tenant: action.payload.tenant,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'UPDATE_TENANT':
      return {
        ...state,
        tenant: state.tenant ? { ...state.tenant, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  updateTenant: (tenantData: Partial<Tenant>) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          dispatch({ type: 'AUTH_FAILURE', payload: null });
          return;
        }

        dispatch({ type: 'AUTH_START' });
        const { user, tenant } = await authService.getCurrentUser();
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, tenant } });
      } catch (error: any) {
        authService.clearSession();
        dispatch({ type: 'AUTH_FAILURE', payload: error?.message ?? 'Authentication required' });
      }
    };

    void initializeAuth();
  }, []);

  const handleSuccess = (response: AuthResponse) => {
    authService.setSession(response);
    dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user, tenant: response.tenant } });
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(email, password);
      handleSuccess(response);
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error?.message ?? 'Unable to login' });
      throw error;
    }
  };

  const register = async (userData: Record<string, unknown>) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.register(userData);
      handleSuccess(response);
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error?.message ?? 'Unable to register' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      authService.clearSession();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      handleSuccess(response);
    } catch (error: any) {
      await logout();
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error?.message ?? 'Unable to update profile' });
      throw error;
    }
  };

  const updateTenant = async (tenantData: Partial<Tenant>) => {
    try {
      const updatedTenant = await authService.updateTenant(tenantData);
      dispatch({ type: 'UPDATE_TENANT', payload: updatedTenant });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error?.message ?? 'Unable to update tenant' });
      throw error;
    }
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    updateTenant,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
