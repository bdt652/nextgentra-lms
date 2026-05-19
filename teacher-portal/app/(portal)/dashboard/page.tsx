'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCourses } from '@/lib/api/courses';
import type { Course } from '@/lib/types';

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {course.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            course.is_published
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {course.is_published ? 'Đã xuất bản' : 'Nháp'}
        </span>
      </div>
      {course.description && (
        <p className="mb-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {course.description}
        </p>
      )}
      <span className="mt-auto text-xs text-gray-400">
        {course.lesson_count} bài học
      </span>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-3 h-3 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function EmptyState() {
  return (
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
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      </div>
      <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">
        Chưa có khóa học nào
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Tạo khóa học đầu tiên để bắt đầu giảng dạy.
      </p>
      <Link
        href="/courses"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Tạo khóa học
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCourses(true)
      .then(setCourses)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra'),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Khóa học của tôi
        </h2>
        {!loading && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {courses.length} khóa học
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
      ) : courses.length === 0 && !error ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
