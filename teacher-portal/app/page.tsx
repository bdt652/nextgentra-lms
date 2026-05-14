'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import type { AuthState } from '@/lib/store/authStore';

export default function Home() {
  const router = useRouter();
  const access_token = useAuthStore((state: AuthState) => state.access_token);

  useEffect(() => {
    if (access_token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [access_token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600 text-white shadow-lg mb-4">
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
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          NextGenTra LMS
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Giáo dục không giới hạn, kiến thức vô tận
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:ring-offset-2 transition-all duration-200 shadow-md cursor-pointer"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg border-2 border-emerald-600 text-emerald-600 font-medium hover:bg-emerald-50 hover:border-emerald-700 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:ring-offset-2 transition-all duration-200 dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:border-emerald-500 cursor-pointer"
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
