import type { ReactNode } from 'react';
import Link from 'next/link';

interface StudentAuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function StudentAuthLayout({
  children,
  title,
  description,
}: StudentAuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 py-12 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:rounded-lg focus:px-3 focus:py-2 cursor-pointer"
            tabIndex={-1}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg group-hover:shadow-indigo-500/40 transition-all duration-200">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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
          © {new Date().getFullYear()} NextGenTra LMS. Học tập thông minh.
        </p>
      </div>
    </div>
  );
}
