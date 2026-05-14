'use client';

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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Tạo khóa học đầu tiên để bắt đầu giảng dạy.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  // TODO: Fetch from API — GET /courses/teacher/me
  const courses: unknown[] = [];

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

      <EmptyState />
    </div>
  );
}
