import type { Student, TokenResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: { detail: string } = await res.json();
    throw new Error(error.detail || 'Đã có lỗi xảy ra');
  }
  return res.json();
}

export async function loginStudent(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<TokenResponse>(res);
}

export async function registerStudent(
  name: string,
  email: string,
  password: string,
  student_code: string,
  class_?: string,
): Promise<Student> {
  const body: Record<string, string> = { name, email, password, student_code };
  if (class_) body['class'] = class_;

  const res = await fetch(`${API_BASE_URL}/auth/student/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<Student>(res);
}

export async function getStudentProfile(
  access_token: string,
): Promise<Student> {
  const res = await fetch(`${API_BASE_URL}/auth/student/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return handleResponse<Student>(res);
}

export async function refreshStudentToken(
  refresh_token: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/student/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  return handleResponse<TokenResponse>(res);
}

export async function logoutStudent(refresh_token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/student/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    const error: { detail: string } = await res.json();
    throw new Error(error.detail || 'Đăng xuất thất bại');
  }
}
