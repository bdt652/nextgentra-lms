'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { TeacherAuthLayout } from './TeacherAuthLayout';
import { AuthInput } from './ui/AuthInput';
import { PasswordField } from './ui/PasswordField';
import { AuthButton } from './ui/AuthButton';
import {
  registerSchema,
  type RegisterFormData,
} from '@/lib/validations/authSchemas';
import { registerTeacher } from '@/lib/api/auth';

export function TeacherRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      await registerTeacher(data.name, data.email, data.password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    }
  };

  if (success) {
    return (
      <TeacherAuthLayout
        title="Đăng ký thành công!"
        description="Tài khoản của bạn đã được tạo. Bạn sẽ được chuyển hướng đến trang đăng nhập."
      >
        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang chuyển hướng...
          </p>
        </div>
      </TeacherAuthLayout>
    );
  }

  return (
    <TeacherAuthLayout
      title="Đăng ký tài khoản"
      description="Tạo tài khoản giáo viên mới để bắt đầu giảng dạy."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <AuthInput
          id="name"
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Thị B"
          error={errors.name?.message}
          {...register('name')}
        />

        <AuthInput
          id="email"
          label="Email"
          type="email"
          placeholder="giaovien@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          id="password"
          label="Mật khẩu"
          placeholder="Tối thiểu 8 ký tự"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordField
          id="confirmPassword"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <AuthButton type="submit" isLoading={isSubmitting}>
          Đăng ký
        </AuthButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-medium text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:rounded focus:px-1 focus:py-0.5 transition-all dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </TeacherAuthLayout>
  );
}
