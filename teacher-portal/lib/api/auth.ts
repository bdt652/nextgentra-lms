import type { Teacher, TokenResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: { detail: string } = await res.json();
    throw new Error(error.detail || 'Đã có lỗi xảy ra');
  }
  return res.json();
}

export async function loginTeacher(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/teacher/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<TokenResponse>(res);
}

export async function registerTeacher(
  name: string,
  email: string,
  password: string,
  role: string = 'teacher',
): Promise<Teacher> {
  const res = await fetch(`${API_BASE_URL}/auth/teacher/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleResponse<Teacher>(res);
}

export async function getTeacherProfile(
  access_token: string,
): Promise<Teacher> {
  const res = await fetch(`${API_BASE_URL}/auth/teacher/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return handleResponse<Teacher>(res);
}

export async function refreshTeacherToken(
  refresh_token: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/teacher/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  return handleResponse<TokenResponse>(res);
}

export async function logoutTeacher(refresh_token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/teacher/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    const error: { detail: string } = await res.json();
    throw new Error(error.detail || 'Đăng xuất thất bại');
  }
}
