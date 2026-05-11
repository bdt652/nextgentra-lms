import type { ReactNode } from 'react';
import Link from 'next/link';

interface TeacherAuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function TeacherAuthLayout({
  children,
  title,
  description,
}: TeacherAuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-12 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:rounded-lg focus:px-3 focus:py-2 cursor-pointer"
            tabIndex={-1}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:shadow-emerald-500/40 transition-all duration-200">
              <svg
                className="h-7 w-7"
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
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {/* Form Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} NextGenTra LMS. Giáo dục không giới hạn.
        </p>
      </div>
    </div>
  );
}
