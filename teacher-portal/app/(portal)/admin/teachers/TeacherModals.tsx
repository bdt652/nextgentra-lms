'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetTeacherPassword, updateTeacher } from '@/lib/api/admin';
import type { TeacherAdmin } from '@/lib/types';

// ---------------------------------------------------------------------------
// Edit teacher modal
// ---------------------------------------------------------------------------

const editSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  is_active: z.boolean(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditProps {
  teacher: TeacherAdmin;
  onClose: () => void;
  onSaved: (updated: TeacherAdmin) => void;
}

export function EditTeacherModal({ teacher, onClose, onSaved }: EditProps) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: teacher.name,
      email: teacher.email,
      is_active: teacher.is_active,
    },
  });

  const onSubmit = async (data: EditFormData) => {
    setApiError(null);
    try {
      const updated = await updateTeacher(teacher.id, data);
      onSaved(updated);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Chỉnh sửa giáo viên
          </h3>
        </div>

        <form
          id="edit-teacher-form"
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
              Tên <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Tài khoản đang hoạt động
          </label>
        </form>

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
            form="edit-teacher-form"
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

// ---------------------------------------------------------------------------
// Reset password modal
// ---------------------------------------------------------------------------

const resetSchema = z
  .object({
    new_password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

interface ResetProps {
  teacher: TeacherAdmin;
  onClose: () => void;
  onDone: () => void;
}

export function ResetPasswordModal({ teacher, onClose, onDone }: ResetProps) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setApiError(null);
    try {
      await resetTeacherPassword(teacher.id, data.new_password);
      onDone();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Đặt lại mật khẩu — {teacher.name}
          </h3>
        </div>

        <form
          id="reset-password-form"
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
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              {...register('new_password')}
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Tối thiểu 8 ký tự"
            />
            {errors.new_password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.new_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              {...register('confirm_password')}
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Nhập lại mật khẩu"
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.confirm_password.message}
              </p>
            )}
          </div>
        </form>

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
            form="reset-password-form"
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
}
