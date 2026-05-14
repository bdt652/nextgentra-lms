import type { PermissionDef, Role, TeacherAdmin } from '../types';
import { apiFetch } from './client';

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const error: { detail: string } = await res
      .json()
      .catch(() => ({ detail: 'Đã có lỗi xảy ra' }));
    throw new Error(error.detail || 'Đã có lỗi xảy ra');
  }
  return res.json();
}

export async function listTeachers(): Promise<TeacherAdmin[]> {
  const res = await apiFetch('/admin/teachers');
  return handleResponse<TeacherAdmin[]>(res);
}

export async function assignTeacherRole(
  teacherId: string,
  roleId: string | null
): Promise<TeacherAdmin> {
  const res = await apiFetch(`/admin/teachers/${teacherId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role_id: roleId }),
  });
  return handleResponse<TeacherAdmin>(res);
}

export async function listRoles(): Promise<Role[]> {
  const res = await apiFetch('/admin/roles');
  return handleResponse<Role[]>(res);
}

export async function createRole(data: {
  name: string;
  description?: string;
  permission_ids: string[];
}): Promise<Role> {
  const res = await apiFetch('/admin/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Role>(res);
}

export async function updateRole(
  roleId: string,
  data: { name?: string; description?: string; permission_ids?: string[] }
): Promise<Role> {
  const res = await apiFetch(`/admin/roles/${roleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Role>(res);
}

export async function deleteRole(roleId: string): Promise<void> {
  const res = await apiFetch(`/admin/roles/${roleId}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}

export async function listPermissions(): Promise<PermissionDef[]> {
  const res = await apiFetch('/admin/permissions');
  return handleResponse<PermissionDef[]>(res);
}

export async function addRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<Role> {
  const res = await apiFetch(`/admin/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
  return handleResponse<Role>(res);
}

export async function removeRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<Role> {
  const res = await apiFetch(`/admin/roles/${roleId}/permissions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
  return handleResponse<Role>(res);
}
