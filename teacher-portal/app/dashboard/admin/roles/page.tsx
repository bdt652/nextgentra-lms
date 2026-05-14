'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
} from '@/lib/api/admin';
import { useIsAdmin } from '@/lib/hooks/usePermission';
import { useHasHydrated } from '@/lib/store/authStore';
import type { PermissionDef, Role } from '@/lib/types';

const roleSchema = z.object({
  name: z.string().min(1, 'Tên role là bắt buộc'),
  description: z.string().optional(),
  permission_ids: z.array(z.string()),
});

type RoleFormData = z.infer<typeof roleSchema>;

function RoleModal({
  role,
  permissions,
  onClose,
  onSaved,
}: {
  role: Role | null;
  permissions: PermissionDef[];
  onClose: () => void;
  onSaved: (saved: Role) => void;
}) {
  const isEdit = role !== null;
  const [apiError, setApiError] = useState<string | null>(null);

  const initialPermIds = role?.permissions.map((p) => p.id) ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialPermIds);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? '',
      description: role?.description ?? '',
      permission_ids: initialPermIds,
    },
  });

  const togglePermission = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    setValue('permission_ids', next);
  };

  const onSubmit = async (data: RoleFormData) => {
    setApiError(null);
    try {
      const saved = isEdit
        ? await updateRole(role.id, {
            name: data.name,
            description: data.description,
            permission_ids: data.permission_ids,
          })
        : await createRole({
            name: data.name,
            description: data.description,
            permission_ids: data.permission_ids,
          });
      onSaved(saved);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Chỉnh sửa role' : 'Tạo role mới'}
          </h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {apiError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {apiError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên role <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="vd: content_editor"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <input
              {...register('description')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Mô tả ngắn về role này"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Permissions
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-600">
              {permissions.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Không có permission nào.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex cursor-pointer items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{perm.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const isAdmin = useIsAdmin();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modalRole, setModalRole] = useState<Role | null | 'new'>('new');
  const [modalOpen, setModalOpen] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    const load = async () => {
      try {
        const [roleList, permList] = await Promise.all([
          listRoles(),
          listPermissions(),
        ]);
        setRoles(roleList);
        setPermissions(permList);
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

  const openCreate = () => {
    setModalRole(null);
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setModalRole(role);
    setModalOpen(true);
  };

  const handleSaved = (saved: Role) => {
    setRoles((list) => {
      const exists = list.find((r) => r.id === saved.id);
      return exists
        ? list.map((r) => (r.id === saved.id ? saved : r))
        : [...list, saved];
    });
    setModalOpen(false);
  };

  const handleDeleteConfirm = async (roleId: string) => {
    setDeletingId(roleId);
    setDeleteErrors((e) => ({ ...e, [roleId]: '' }));
    try {
      await deleteRole(roleId);
      setRoles((list) => list.filter((r) => r.id !== roleId));
      setConfirmDeleteId(null);
    } catch (err) {
      setDeleteErrors((e) => ({
        ...e,
        [roleId]: err instanceof Error ? err.message : 'Xóa thất bại',
      }));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Quản trị
          </Link>
          <span className="text-gray-400">/</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Roles &amp; Permissions
          </h2>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Tạo role mới
        </button>
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
              className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {role.name}
                    </span>
                    {role.description && (
                      <span className="text-xs text-gray-400">
                        — {role.description}
                      </span>
                    )}
                  </div>
                  {role.permissions.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {role.permissions.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">
                      Không có permissions
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {confirmDeleteId === role.id ? (
                    <>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Xác nhận xóa?
                      </span>
                      <button
                        onClick={() => handleDeleteConfirm(role.id)}
                        disabled={deletingId === role.id}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                      >
                        {deletingId === role.id ? '...' : 'Có'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Không
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openEdit(role)}
                        className="rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(role.id);
                          setDeleteErrors((e) => ({ ...e, [role.id]: '' }));
                        }}
                        className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>

              {deleteErrors[role.id] && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {deleteErrors[role.id]}
                </p>
              )}
            </div>
          ))}

          {roles.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">
              Chưa có role nào.
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <RoleModal
          role={modalRole === 'new' ? null : modalRole}
          permissions={permissions}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
