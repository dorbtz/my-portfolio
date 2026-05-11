/**
 * src/hooks/useAuth.helpers.ts
 *
 * Round 74 — `useAuth` hook + the React context it reads were split out
 * of `useAuth.tsx` so that the .tsx file holds only the `AuthProvider`
 * component (react-refresh/only-export-components lint rule). Behavior
 * unchanged from the previous co-located definition.
 */

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export type AuthState = {
  user: User | null;
  loading: boolean;
};

export const AuthCtx = createContext<AuthState>({ user: null, loading: true });

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
