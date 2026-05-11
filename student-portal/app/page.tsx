'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import type { AuthState } from '@/lib/store/authStore';

export default function Home() {
  const router = useRouter();
  const token = useAuthStore((state: AuthState) => state.token);

  useEffect(() => {
    if (token) {
      // Redirect to dashboard (to be implemented)
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600 text-white shadow-lg mb-4">
          <svg
            className="h-10 w-10"
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          NextGenTra LMS
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Học tập thông minh, thành công vững chắc
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:ring-offset-2 transition-all duration-200 shadow-md cursor-pointer"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg border-2 border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-700 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:ring-offset-2 transition-all duration-200 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:border-indigo-500 cursor-pointer"
          >
            Đăng ký
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Đang chuyển hướng...
        </p>
      </div>
    </div>
  );
}
