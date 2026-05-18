'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getLesson } from '@/lib/api/student';
import type { LessonResponse } from '@/lib/types';

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  ppt: '📊',
  pptx: '📊',
  xls: '📈',
  xlsx: '📈',
  zip: '🗜️',
  mp4: '🎬',
  mp3: '🎵',
};

function fileIcon(fileType: string) {
  return FILE_ICONS[fileType.toLowerCase()] ?? '📎';
}

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = use(params);
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLesson(courseId, lessonId)
      .then(setLesson)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
      )
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
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

  if (!lesson) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/classes"
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Lớp học
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${courseId}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Khóa học
        </Link>
        <span>/</span>
        <span className="truncate text-gray-900 dark:text-white">
          {lesson.title}
        </span>
      </nav>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {lesson.title}
      </h2>

      {/* Video */}
      {lesson.video_url && (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <video controls className="w-full" src={lesson.video_url}>
            Trình duyệt không hỗ trợ phát video.
          </video>
        </div>
      )}

      {/* Content */}
      {lesson.content && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Nội dung bài học
          </h3>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {lesson.content}
          </pre>
        </div>
      )}

      {/* Attachments */}
      {lesson.attachments.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Tài liệu đính kèm ({lesson.attachments.length})
          </h3>
          <div className="space-y-2">
            {lesson.attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/10"
              >
                <span className="text-xl">{fileIcon(att.file_type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {att.name}
                  </p>
                  <p className="text-xs uppercase text-gray-400">
                    {att.file_type}
                  </p>
                </div>
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Back to course */}
      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Quay lại khóa học
        </Link>
      </div>
    </div>
  );
}
