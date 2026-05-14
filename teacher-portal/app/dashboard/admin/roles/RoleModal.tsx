'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRole, updateRole } from '@/lib/api/admin';
import type { PermissionDef, Role } from '@/lib/types';

const roleSchema = z.object({
  name: z.string().min(1, 'Tên role là bắt buộc'),
  description: z.string().optional(),
  permission_ids: z.array(z.string()),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface Props {
  role: Role | null;
  permissions: PermissionDef[];
  onClose: () => void;
  onSaved: (saved: Role) => void;
}

export function RoleModal({ role, permissions, onClose, onSaved }: Props) {
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
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        {/* Sticky header */}
        <div className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Chỉnh sửa role' : 'Tạo role mới'}
          </h3>
        </div>

        {/* Scrollable body */}
        <form
          id="role-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
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
            {permissions.length === 0 ? (
              <p className="text-xs text-gray-400">Không có permission nào.</p>
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
        </form>

        {/* Sticky footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
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
            form="role-form"
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
