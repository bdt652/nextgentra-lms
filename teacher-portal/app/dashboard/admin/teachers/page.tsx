'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { assignTeacherRole, listRoles, listTeachers } from '@/lib/api/admin';
import { useIsAdmin } from '@/lib/hooks/usePermission';
import { useHasHydrated } from '@/lib/store/authStore';
import type { Role, TeacherAdmin } from '@/lib/types';

export default function TeachersPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const isAdmin = useIsAdmin();

  const [teachers, setTeachers] = useState<TeacherAdmin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    const load = async () => {
      try {
        const [teacherList, roleList] = await Promise.all([
          listTeachers(),
          listRoles(),
        ]);
        setTeachers(teacherList);
        setRoles(roleList);
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : 'Không thể tải dữ liệu'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hasHydrated, isAdmin, router]);

  if (!hasHydrated || (!isAdmin && hasHydrated)) return null;

  const handleRoleChange = async (teacher: TeacherAdmin, newRoleId: string) => {
    const roleId = newRoleId === '' ? null : newRoleId;
    const prev = teacher.role_id;

    setTeachers((list) =>
      list.map((t) => (t.id === teacher.id ? { ...t, role_id: roleId } : t))
    );
    setUpdatingId(teacher.id);
    setRowErrors((e) => ({ ...e, [teacher.id]: '' }));

    try {
      const updated = await assignTeacherRole(teacher.id, roleId);
      setTeachers((list) =>
        list.map((t) => (t.id === teacher.id ? updated : t))
      );
    } catch (err) {
      setTeachers((list) =>
        list.map((t) => (t.id === teacher.id ? { ...t, role_id: prev } : t))
      );
      setRowErrors((e) => ({
        ...e,
        [teacher.id]: err instanceof Error ? err.message : 'Cập nhật thất bại',
      }));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/dashboard/admin"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Quản trị
        </Link>
        <span className="text-gray-400">/</span>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quản lý giáo viên
        </h2>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Tên
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Email
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {teachers.map((teacher) => (
                <>
                  <tr key={teacher.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {teacher.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {teacher.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={teacher.role_id ?? ''}
                          disabled={updatingId === teacher.id}
                          onChange={(e) =>
                            handleRoleChange(teacher, e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                        >
                          <option value="">Không có role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        {updatingId === teacher.id && (
                          <div className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          teacher.is_active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {teacher.is_active ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                  </tr>
                  {rowErrors[teacher.id] && (
                    <tr key={`${teacher.id}-err`}>
                      <td
                        colSpan={4}
                        className="px-4 pb-2 text-xs text-red-600 dark:text-red-400"
                      >
                        {rowErrors[teacher.id]}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    Chưa có giáo viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
