import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Teacher } from '../types';

export interface AuthState {
  access_token: string | null;
  refresh_token: string | null;
  teacher: Teacher | null;
  _hasHydrated: boolean;
  setTokens: (access_token: string, refresh_token: string) => void;
  setTeacher: (teacher: Teacher | null) => void;
  logout: () => void;
  _setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      refresh_token: null,
      teacher: null,
      _hasHydrated: false,
      setTokens: (access_token, refresh_token) =>
        set({ access_token, refresh_token }),
      setTeacher: (teacher) => set({ teacher }),
      logout: () =>
        set({ access_token: null, refresh_token: null, teacher: null }),
      _setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
    }),
    {
      name: 'teacher-auth',
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        teacher: state.teacher,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);

export function useHasHydrated(): boolean {
  return useAuthStore((state) => state._hasHydrated);
}

export function useHasPermission(permission: string): boolean {
  return useAuthStore(
    (state) => state.teacher?.permissions?.includes(permission) ?? false
  );
}

export function usePermissions(): string[] {
  return useAuthStore((state) => state.teacher?.permissions ?? []);
}
