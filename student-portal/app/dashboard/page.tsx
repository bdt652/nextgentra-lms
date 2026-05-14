'use client';

import type { Course } from '@/lib/types';

const STATUS_CONFIG = {
  not_started: {
    label: 'Chưa bắt đầu',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  },
  in_progress: {
    label: 'Đang học',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  completed: {
    label: 'Hoàn thành',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
};

function CourseCard({ course }: { course: Course }) {
  const status = STATUS_CONFIG[course.status];

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {course.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        Giáo viên: {course.teacher_name}
      </p>

      <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
        {course.description}
      </p>

      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Tiến độ</span>
          <span className="font-medium">{course.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all ${
              course.status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">
        Chưa có khóa học nào
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Liên hệ giáo viên để được thêm vào khóa học.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  // TODO: Fetch from API — GET /courses/student/me
  const courses: Course[] = [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Khóa học của tôi
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {courses.length} khóa học
        </span>
      </div>

      {courses.length === 0 ? (
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
