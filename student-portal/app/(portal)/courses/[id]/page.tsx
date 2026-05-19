'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourseDetail } from '@/lib/api/student';
import type { CourseDetailResponse, LessonResponse } from '@/lib/types';

function LessonItem({
  lesson,
  courseId,
  index,
}: {
  lesson: LessonResponse;
  courseId: string;
  index: number;
}) {
  return (
    <Link
      href={`/courses/${courseId}/lessons/${lesson.id}`}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {lesson.title}
        </p>
        {lesson.attachments.length > 0 && (
          <p className="text-xs text-gray-400">
            {lesson.attachments.length} tài liệu đính kèm
          </p>
        )}
      </div>
      {lesson.video_url && (
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          Video
        </span>
      )}
      <svg
        className="h-4 w-4 shrink-0 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [course, setCourse] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCourseDetail(id)
      .then(setCourse)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!course) return null;

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/classes"
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Lớp học
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{course.title}</span>
      </nav>

      {/* Course Header */}
      <div>
        <div className="flex flex-wrap items-start gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {course.title}
          </h2>
          {course.category && (
            <span
              className="mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: course.category.color }}
            >
              {course.category.icon} {course.category.name}
            </span>
          )}
        </div>
        {course.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {course.description}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {sortedLessons.length} bài học
        </p>
      </div>

      {/* Lessons */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Nội dung khóa học
        </h3>
        {sortedLessons.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có bài học nào.</p>
        ) : (
          <div className="space-y-2">
            {sortedLessons.map((lesson, i) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                courseId={id}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
