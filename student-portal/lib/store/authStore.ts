import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student } from '../types';

export interface AuthState {
  access_token: string | null;
  refresh_token: string | null;
  student: Student | null;
  setTokens: (access_token: string, refresh_token: string) => void;
  setStudent: (student: Student | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      refresh_token: null,
      student: null,
      setTokens: (access_token, refresh_token) =>
        set({ access_token, refresh_token }),
      setStudent: (student) => set({ student }),
      logout: () =>
        set({ access_token: null, refresh_token: null, student: null }),
    }),
    {
      name: 'student-auth',
    }
  )
);

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // persist is undefined during SSR — only access in browser
    const store = useAuthStore.persist;
    if (!store) return;
    if (store.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    return store.onFinishHydration(() => setHasHydrated(true));
  }, []);

  return hasHydrated;
}
