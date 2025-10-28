import { useAuthContext } from '../context/AuthContext.tsx';

export function useAuth() {
  return useAuthContext();
}
