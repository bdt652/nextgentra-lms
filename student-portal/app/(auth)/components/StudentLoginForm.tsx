'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { StudentAuthLayout } from './StudentAuthLayout';
import { AuthInput } from './ui/AuthInput';
import { PasswordField } from './ui/PasswordField';
import { AuthButton } from './ui/AuthButton';
import { loginSchema, type LoginFormData } from '@/lib/validations/authSchemas';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function StudentLoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { setToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await login(data.email, data.password);

      // Store token
      localStorage.setItem('access_token', response.access_token);
      setToken(response.access_token);

      // Redirect to home or dashboard
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  };

  return (
    <StudentAuthLayout
      title="Đăng nhập"
      description="Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản học sinh của bạn."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <AuthInput
          id="email"
          label="Email"
          type="email"
          placeholder="hocsinh@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          id="password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-600/50 transition-all cursor-pointer"
            />
            <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              Ghi nhớ tôi
            </span>
          </label>
          <button
            type="button"
            className="text-sm font-medium text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:rounded focus:px-1 focus:py-0.5 transition-all dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
          >
            Quên mật khẩu?
          </button>
        </div>

        <AuthButton type="submit" isLoading={isSubmitting}>
          Đăng nhập
        </AuthButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="font-medium text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:rounded focus:px-1 focus:py-0.5 transition-all dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </StudentAuthLayout>
  );
}
