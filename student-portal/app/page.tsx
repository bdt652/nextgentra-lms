'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store/authStore';
import type { AuthState } from '@/lib/store/authStore';

export default function Home() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const access_token = useAuthStore((state: AuthState) => state.access_token);

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(access_token ? '/classes' : '/login');
  }, [hasHydrated, access_token, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          NextGenTra LMS
        </h1>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          Nền tảng học tập trực tuyến
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </main>
  );
}
