'use client';

import { useEffect, useState } from 'react';
import { listTeachers } from '@/lib/api/admin';
import type { ClassTeacher, TeacherAdmin } from '@/lib/types';

type TeacherRole = 'assistant' | 'ta';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Chủ lớp',
  assistant: 'Giảng viên',
  ta: 'Trợ giảng',
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  owner: 'bg-emerald-100 text-emerald-700',
  assistant: 'bg-blue-100 text-blue-700',
  ta: 'bg-amber-100 text-amber-700',
};

export function TeachersTab({
  teachers,
  canManage,
  onAdd,
  onRemove,
  onUpdateRole,
}: {
  teachers: ClassTeacher[];
  canManage: boolean;
  onAdd: (teacher: TeacherAdmin, role: TeacherRole) => Promise<void>;
  onRemove: (teacherId: string, name: string) => void;
  onUpdateRole?: (teacherId: string, role: TeacherRole) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [allTeachers, setAllTeachers] = useState<TeacherAdmin[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(canManage);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAdmin | null>(
    null,
  );
  const [selectedRole, setSelectedRole] = useState<TeacherRole>('assistant');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);

  const memberIds = new Set(teachers.map((t) => t.teacher_id));

  useEffect(() => {
    if (!canManage) return;
    listTeachers()
      .then(setAllTeachers)
      .catch(() => setError('Không thể tải danh sách giáo viên'))
      .finally(() => setLoadingTeachers(false));
  }, [canManage]);

  const filtered = query.trim()
    ? allTeachers.filter(
        (t) =>
          !memberIds.has(t.id) &&
          (t.name.toLowerCase().includes(query.toLowerCase()) ||
            t.email.toLowerCase().includes(query.toLowerCase())),
      )
    : [];

  const handleAdd = async () => {
    if (!selectedTeacher) return;
    setAdding(true);
    setError(null);
    try {
      await onAdd(selectedTeacher, selectedRole);
      setQuery('');
      setSelectedTeacher(null);
      setSelectedRole('assistant');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (teacherId: string, role: TeacherRole) => {
    if (!onUpdateRole) return;
    setUpdatingRoleFor(teacherId);
    try {
      await onUpdateRole(teacherId, role);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  return (
    <div>
      {teachers.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {teachers.map((t) => (
            <li
              key={t.teacher_id}
              className="flex items-center gap-3 px-5 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                {t.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                  {t.name}
                </p>
                <p className="text-xs text-gray-400">{t.email}</p>
              </div>

              {t.role === 'owner' ? (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  Chủ lớp
                </span>
              ) : canManage && onUpdateRole ? (
                <select
                  value={t.role}
                  disabled={updatingRoleFor === t.teacher_id}
                  onChange={(e) =>
                    handleRoleChange(
                      t.teacher_id,
                      e.target.value as TeacherRole,
                    )
                  }
                  className={`shrink-0 cursor-pointer rounded-full border-0 py-0.5 pl-2 pr-6 text-xs font-medium focus:ring-1 focus:ring-emerald-500 ${
                    ROLE_BADGE_CLASS[t.role] ?? 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <option value="assistant">Giảng viên</option>
                  <option value="ta">Trợ giảng</option>
                </select>
              ) : (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    ROLE_BADGE_CLASS[t.role] ?? 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {ROLE_LABELS[t.role] ?? t.role}
                </span>
              )}

              {canManage && t.role !== 'owner' && (
                <button
                  onClick={() => onRemove(t.teacher_id, t.name)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Xóa
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-gray-400">
          Chưa có giáo viên nào
        </p>
      )}

      {canManage && (
        <div className="border-t border-gray-100 p-4 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedTeacher(null);
                setError(null);
              }}
              placeholder={
                loadingTeachers
                  ? 'Đang tải...'
                  : 'Tìm theo tên hoặc email giáo viên...'
              }
              disabled={loadingTeachers}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {filtered.length > 0 && !selectedTeacher && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                {filtered.slice(0, 8).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTeacher(t);
                      setQuery(t.name);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {t.name}
                    </span>
                    <span className="text-gray-400">{t.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

          {selectedTeacher && (
            <div className="mt-2 space-y-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {selectedTeacher.name}
                  <span className="ml-2 font-normal text-emerald-600">
                    {selectedTeacher.email}
                  </span>
                </span>
                <button
                  onClick={() => {
                    setSelectedTeacher(null);
                    setQuery('');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="new-teacher-role"
                    value="assistant"
                    checked={selectedRole === 'assistant'}
                    onChange={() => setSelectedRole('assistant')}
                    className="accent-emerald-600"
                  />
                  Giảng viên
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="new-teacher-role"
                    value="ta"
                    checked={selectedRole === 'ta'}
                    onChange={() => setSelectedRole('ta')}
                    className="accent-emerald-600"
                  />
                  Trợ giảng
                </label>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="ml-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {adding ? '...' : 'Thêm'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
