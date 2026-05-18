'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useHasHydrated } from '@/lib/store/authStore';
import type { AuthState } from '@/lib/store/authStore';
import { logoutStudent } from '@/lib/api/auth';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const access_token = useAuthStore((s: AuthState) => s.access_token);
  const refresh_token = useAuthStore((s: AuthState) => s.refresh_token);
  const student = useAuthStore((s: AuthState) => s.student);
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
        await logoutStudent(refresh_token);
      }
    } finally {
      logout();
      router.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/classes"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="hidden font-semibold text-gray-900 dark:text-white sm:block">
                NextGenTra LMS
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/classes"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                Lớp học
              </Link>
            </nav>
          </div>

          {/* Student Info + Logout */}
          <div className="flex items-center gap-4">
            {student && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {student.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {student.student_code}
                  {student.class ? ` · Lớp ${student.class}` : ''}
                </p>
              </div>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {student?.name?.charAt(0).toUpperCase() ?? 'S'}
            </div>
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
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
