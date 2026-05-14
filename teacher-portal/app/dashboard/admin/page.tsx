'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/lib/hooks/usePermission';
import { useHasHydrated } from '@/lib/store/authStore';
import { PermissionGuard } from '@/components/PermissionGuard';

function AdminContent() {
  const sections = [
    {
      title: 'Quản lý giáo viên',
      description:
        'Xem danh sách, kích hoạt hoặc vô hiệu hóa tài khoản giáo viên.',
      badge: 'Sắp ra mắt',
    },
    {
      title: 'Quản lý roles & permissions',
      description: 'Gán roles và cấu hình permissions cho từng giáo viên.',
      badge: 'Sắp ra mắt',
    },
    {
      title: 'Báo cáo hệ thống',
      description: 'Xem thống kê tổng hợp toàn bộ khóa học và học sinh.',
      badge: 'Sắp ra mắt',
    },
    {
      title: 'Quản lý tất cả khóa học',
      description:
        'Xem và quản lý khóa học của tất cả giáo viên trong hệ thống.',
      badge: 'Sắp ra mắt',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bảng điều khiển quản trị
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Các chức năng dành riêng cho quản trị viên.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {section.badge}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {section.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAdmin, router]);

  if (!hasHydrated) return null;

  return (
    <PermissionGuard
      permission="admin:access"
      fallback={
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      }
    >
      <AdminContent />
    </PermissionGuard>
  );
}
