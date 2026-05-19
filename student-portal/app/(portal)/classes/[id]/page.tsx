'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getClassDetail } from '@/lib/api/student';
import type { ClassDetailResponse } from '@/lib/types';

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {title}
    </h3>
  );
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [cls, setCls] = useState<ClassDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClassDetail(id)
      .then(setCls)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700"
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

  if (!cls) return null;

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Header */}
      <div>
        <nav className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/classes"
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Lớp học
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{cls.name}</span>
        </nav>
        <div className="flex flex-wrap items-start gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {cls.name}
          </h2>
          {cls.category && (
            <span
              className="mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: cls.category.color }}
            >
              {cls.category.icon} {cls.category.name}
            </span>
          )}
        </div>
        {cls.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {cls.description}
          </p>
        )}
        <p className="mt-1 font-mono text-xs text-gray-400">
          Mã lớp: {cls.code}
        </p>
      </div>

      {/* Teachers */}
      <section>
        <SectionHeader title={`Giáo viên (${cls.teachers.length})`} />
        {cls.teachers.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có giáo viên.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cls.teachers.map((t) => (
              <div
                key={t.teacher_id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {t.email}
                  </p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {t.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Courses */}
      <section>
        <SectionHeader title={`Khóa học (${cls.courses.length})`} />
        {cls.courses.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có khóa học nào.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cls.courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
              >
                <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {course.title}
                </h4>
                {course.description && (
                  <p className="mb-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {course.description}
                  </p>
                )}
                <span className="mt-auto text-xs text-gray-400">
                  {course.lesson_count} bài học
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Exams */}
      {cls.exams.length > 0 && (
        <section>
          <SectionHeader title={`Bài kiểm tra (${cls.exams.length})`} />
          <div className="grid gap-3 sm:grid-cols-2">
            {cls.exams.map((exam) => (
              <div
                key={exam.exam_id}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {exam.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {exam.duration && <span>{exam.duration} phút</span>}
                  {exam.start_time && (
                    <span>
                      Bắt đầu:{' '}
                      {new Date(exam.start_time).toLocaleString('vi-VN')}
                    </span>
                  )}
                  {exam.end_time && (
                    <span>
                      Kết thúc:{' '}
                      {new Date(exam.end_time).toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
