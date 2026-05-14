import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student } from '../types';

export interface AuthState {
  access_token: string | null;
  refresh_token: string | null;
  student: Student | null;
  _hasHydrated: boolean;
  setTokens: (access_token: string, refresh_token: string) => void;
  setStudent: (student: Student | null) => void;
  logout: () => void;
  _setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      refresh_token: null,
      student: null,
      _hasHydrated: false,
      setTokens: (access_token, refresh_token) =>
        set({ access_token, refresh_token }),
      setStudent: (student) => set({ student }),
      logout: () =>
        set({ access_token: null, refresh_token: null, student: null }),
      _setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
    }),
    {
      name: 'student-auth',
      // Only persist auth tokens — exclude internal hydration flag
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        student: state.student,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);

// Reads directly from store — no useEffect, no setState-in-effect lint issue
export function useHasHydrated(): boolean {
  return useAuthStore((state) => state._hasHydrated);
}
