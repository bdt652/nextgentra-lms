'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyClasses } from '@/lib/api/student';
import type { ClassResponse } from '@/lib/types';

function ClassCard({ cls }: { cls: ClassResponse }) {
  return (
    <Link
      href={`/classes/${cls.id}`}
      className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {cls.name}
        </h3>
        {cls.category && (
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: cls.category.color }}
          >
            {cls.category.icon} {cls.category.name}
          </span>
        )}
      </div>

      {cls.description && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
          {cls.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5"
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
          {cls.teacher_count} giáo viên
        </span>
        <span className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {cls.student_count} học sinh
        </span>
        <span className="ml-auto font-mono text-gray-400">{cls.code}</span>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-4 h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-4">
        <div className="h-3.5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3.5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyClasses()
      .then(setClasses)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Lớp học của tôi
        </h2>
        {!loading && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {classes.length} lớp
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : classes.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">
            Chưa được xếp vào lớp nào
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Liên hệ giáo viên để được thêm vào lớp học.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  );
}
