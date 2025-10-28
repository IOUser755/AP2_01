import { useContext } from 'react';

import { AuthContext, type AuthContextType } from '@context/AuthContext';
import { authService } from '@services/authService';

export type AuthContextWithToken = AuthContextType & { token: string | null };

export const useAuth = (): AuthContextWithToken => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const token = authService.getToken();

  return {
    ...context,
    token,
  };
};
