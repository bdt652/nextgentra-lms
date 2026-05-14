'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsAdmin } from '@/lib/hooks/usePermission';
import { useHasHydrated } from '@/lib/store/authStore';
import { PermissionGuard } from '@/components/PermissionGuard';

function AdminContent() {
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Quản lý giáo viên
            </h3>
          </div>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Xem danh sách giáo viên và gán role cho từng người.
          </p>
          <Link
            href="/dashboard/admin/teachers"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Xem danh sách →
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Roles &amp; Permissions
            </h3>
          </div>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Tạo, sửa roles và cấu hình permissions cho từng role.
          </p>
          <Link
            href="/dashboard/admin/roles"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Quản lý →
          </Link>
        </div>
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
