'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store/authStore';
import type { AuthState } from '@/lib/store/authStore';
import { logoutTeacher } from '@/lib/api/auth';
import { clearAuthCookies } from '@/lib/utils/authCookies';
import { Sidebar } from '@/components/layout/Sidebar';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useHasHydrated();
  const access_token = useAuthStore((s: AuthState) => s.access_token);
  const refresh_token = useAuthStore((s: AuthState) => s.refresh_token);
  const teacher = useAuthStore((s: AuthState) => s.teacher);
  const logout = useAuthStore((s: AuthState) => s.logout);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!access_token) {
      router.replace('/login');
    }
  }, [hasHydrated, access_token, router]);

  if (!hasHydrated || !access_token) return null;

  const handleLogout = async () => {
    try {
      if (refresh_token) {
        await logoutTeacher(refresh_token);
      }
    } finally {
      clearAuthCookies();
      logout();
      router.replace('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar teacher={teacher} pathname={pathname} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:px-6">
          <span className="text-base font-semibold text-gray-900 dark:text-white md:hidden">
            NextGenTra LMS
          </span>

          <div className="flex items-center gap-3">
            {teacher && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {teacher.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {teacher.role ?? 'Giáo viên'}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
