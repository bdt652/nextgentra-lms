'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePermission } from '@/lib/hooks/usePermission';
import {
  getClass,
  updateClass,
  removeStudent,
  assignCourse,
  unassignCourse,
  assignExam,
  unassignExam,
  addTeacher,
  removeTeacher,
} from '@/lib/api/classes';
import { listCourses } from '@/lib/api/courses';
import { listExams } from '@/lib/api/exams';
import type { ClassDetail, ClassEnrollment, Course, Exam } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { Dialog } from '@/components/Dialog';

type Tab = 'students' | 'courses' | 'exams' | 'teachers';

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const canUpdate = usePermission('class:update');
  const canManageStudents = usePermission('class:manage_students');
  const canManageCourses = usePermission('class:manage_courses');

  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('students');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Edit class
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Assign course picker
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assigningCourse, setAssigningCourse] = useState(false);

  // Assign exam picker
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [assigningExam, setAssigningExam] = useState(false);

  // Add teacher
  const [addTeacherId, setAddTeacherId] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  useEffect(() => {
    getClass(id)
      .then(setCls)
      .catch(() => showToast('Không thể tải lớp học', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'courses') {
      listCourses()
        .then(setAvailableCourses)
        .catch(() => {});
    } else if (tab === 'exams') {
      listExams()
        .then(setAvailableExams)
        .catch(() => {});
    }
  }, [tab]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cls) return;
    setSavingEdit(true);
    try {
      const updated = await updateClass(cls.id, {
        name: editName,
        description: editDesc || undefined,
      });
      setCls({ ...cls, ...updated });
      setEditing(false);
      showToast('Đã cập nhật', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAssignCourse = async () => {
    if (!cls || !selectedCourseId) return;
    setAssigningCourse(true);
    try {
      const course = await assignCourse(cls.id, selectedCourseId);
      setCls((prev) =>
        prev ? { ...prev, courses: [...prev.courses, course] } : prev,
      );
      setSelectedCourseId('');
      showToast('Đã gán khóa học', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setAssigningCourse(false);
    }
  };

  const handleUnassignCourse = async (courseId: string) => {
    if (!cls || !confirm('Gỡ khóa học khỏi lớp?')) return;
    try {
      await unassignCourse(cls.id, courseId);
      setCls((prev) =>
        prev
          ? { ...prev, courses: prev.courses.filter((c) => c.id !== courseId) }
          : prev,
      );
      showToast('Đã gỡ khóa học', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleAssignExam = async () => {
    if (!cls || !selectedExamId) return;
    setAssigningExam(true);
    try {
      const ce = await assignExam(cls.id, { exam_id: selectedExamId });
      setCls((prev) => (prev ? { ...prev, exams: [...prev.exams, ce] } : prev));
      setSelectedExamId('');
      showToast('Đã gán đề thi', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setAssigningExam(false);
    }
  };

  const handleUnassignExam = async (examId: string) => {
    if (!cls || !confirm('Gỡ đề thi khỏi lớp?')) return;
    try {
      await unassignExam(cls.id, examId);
      setCls((prev) =>
        prev
          ? { ...prev, exams: prev.exams.filter((e) => e.exam_id !== examId) }
          : prev,
      );
      showToast('Đã gỡ đề thi', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cls || !addTeacherId.trim()) return;
    setAddingTeacher(true);
    try {
      const ct = await addTeacher(cls.id, addTeacherId.trim());
      setCls((prev) =>
        prev
          ? {
              ...prev,
              teachers: [...prev.teachers, ct],
              teacher_count: prev.teacher_count + 1,
            }
          : prev,
      );
      setAddTeacherId('');
      showToast(`Đã thêm giáo viên ${ct.name}`, 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleRemoveTeacher = async (
    teacherId: string,
    teacherName: string,
  ) => {
    if (!cls || !confirm(`Xóa ${teacherName} khỏi lớp?`)) return;
    try {
      await removeTeacher(cls.id, teacherId);
      setCls((prev) =>
        prev
          ? {
              ...prev,
              teachers: prev.teachers.filter((t) => t.teacher_id !== teacherId),
              teacher_count: prev.teacher_count - 1,
            }
          : prev,
      );
      showToast('Đã xóa giáo viên', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const copyCode = () => {
    if (!cls) return;
    navigator.clipboard
      .writeText(cls.code)
      .then(() => showToast('Đã copy mã lớp', 'success'));
  };

  if (loading)
    return <div className="py-12 text-center text-gray-500">Đang tải...</div>;
  if (!cls)
    return (
      <div className="py-12 text-center text-gray-500">
        Không tìm thấy lớp học.{' '}
        <Link href="/classes" className="text-emerald-600 hover:underline">
          Quay lại
        </Link>
      </div>
    );

  const assignedCourseIds = new Set(cls.courses.map((c) => c.id));
  const assignedExamIds = new Set(cls.exams.map((e) => e.exam_id));
  const unassignedCourses = availableCourses.filter(
    (c) => !assignedCourseIds.has(c.id),
  );
  const unassignedExams = availableExams.filter(
    (e) => !assignedExamIds.has(e.id),
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/classes" className="hover:text-gray-700">
          Lớp học
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {cls.name}
        </span>
      </div>

      {/* Class header */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {cls.name}
          </h1>
          {cls.description && (
            <p className="mt-1 text-sm text-gray-500">{cls.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span>{cls.student_count} học sinh</span>
            <span>{cls.teacher_count} giáo viên</span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 font-mono text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              {cls.code}
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
        {canUpdate && (
          <button
            onClick={() => {
              setEditName(cls.name);
              setEditDesc(cls.description ?? '');
              setEditing(true);
            }}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600"
          >
            Sửa
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800 w-fit">
        {(
          [
            { key: 'students', label: 'Học sinh' },
            { key: 'courses', label: 'Khóa học' },
            { key: 'exams', label: 'Đề thi' },
            { key: 'teachers', label: 'Giáo viên' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Students tab */}
        {tab === 'students' && (
          <StudentsTab
            classId={cls.id}
            canManage={canManageStudents}
            onEnrolled={() =>
              setCls((prev) =>
                prev
                  ? { ...prev, student_count: prev.student_count + 1 }
                  : prev,
              )
            }
            onRemove={(sid, name) => {
              if (!confirm(`Xóa ${name} khỏi lớp?`)) return;
              removeStudent(cls.id, sid)
                .then(() => {
                  setCls((prev) =>
                    prev
                      ? {
                          ...prev,
                          student_count: Math.max(0, prev.student_count - 1),
                        }
                      : prev,
                  );
                  showToast('Đã xóa học sinh', 'success');
                })
                .catch((e: Error) => showToast(e.message, 'error'));
            }}
          />
        )}

        {/* Courses tab */}
        {tab === 'courses' && (
          <div>
            {cls.courses.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {cls.courses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        {c.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.lesson_count} bài học
                      </p>
                    </div>
                    <Link
                      href={`/courses/${c.id}`}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Xem
                    </Link>
                    {canManageCourses && (
                      <button
                        onClick={() => handleUnassignCourse(c.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Gỡ
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canManageCourses && unassignedCourses.length > 0 && (
              <div className="flex items-center gap-2 border-t border-gray-100 p-4 dark:border-gray-700">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Chọn khóa học --</option>
                  {unassignedCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignCourse}
                  disabled={assigningCourse || !selectedCourseId}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {assigningCourse ? '...' : 'Gán'}
                </button>
              </div>
            )}
            {cls.courses.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-gray-400">
                Chưa có khóa học nào
              </p>
            )}
          </div>
        )}

        {/* Exams tab */}
        {tab === 'exams' && (
          <div>
            {cls.exams.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {cls.exams.map((ce) => (
                  <li
                    key={ce.exam_id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        {ce.title}
                      </p>
                      <div className="flex gap-3 text-xs text-gray-400">
                        {ce.duration && <span>{ce.duration} phút</span>}
                        {ce.start_time && (
                          <span>
                            Từ{' '}
                            {new Date(ce.start_time).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                        )}
                        {ce.end_time && (
                          <span>
                            đến{' '}
                            {new Date(ce.end_time).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/exams/${ce.exam_id}`}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Xem
                    </Link>
                    {canManageCourses && (
                      <button
                        onClick={() => handleUnassignExam(ce.exam_id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Gỡ
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canManageCourses && unassignedExams.length > 0 && (
              <div className="flex items-center gap-2 border-t border-gray-100 p-4 dark:border-gray-700">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Chọn đề thi --</option>
                  {unassignedExams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignExam}
                  disabled={assigningExam || !selectedExamId}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {assigningExam ? '...' : 'Gán'}
                </button>
              </div>
            )}
            {cls.exams.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-gray-400">
                Chưa có đề thi nào
              </p>
            )}
          </div>
        )}

        {/* Teachers tab */}
        {tab === 'teachers' && (
          <div>
            {cls.teachers.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {cls.teachers.map((t) => (
                  <li
                    key={t.teacher_id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-400">{t.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        t.role === 'owner'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {t.role === 'owner' ? 'Chủ lớp' : 'Giảng viên'}
                    </span>
                    {canUpdate && t.role !== 'owner' && (
                      <button
                        onClick={() =>
                          handleRemoveTeacher(t.teacher_id, t.name)
                        }
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Xóa
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canUpdate && (
              <form
                onSubmit={handleAddTeacher}
                className="flex items-center gap-2 border-t border-gray-100 p-4 dark:border-gray-700"
              >
                <input
                  type="text"
                  value={addTeacherId}
                  onChange={(e) => setAddTeacherId(e.target.value)}
                  placeholder="Teacher ID..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={addingTeacher || !addTeacherId.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addingTeacher ? '...' : 'Thêm'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Edit class dialog */}
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Sửa lớp học"
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="edit-class-form"
              disabled={savingEdit}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingEdit ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        }
      >
        <form
          id="edit-class-form"
          onSubmit={handleSaveEdit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoFocus
              placeholder="Tên lớp"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              placeholder="Mô tả"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </form>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function StudentsTab({
  classId,
  canManage,
  onRemove,
  onEnrolled,
}: {
  classId: string;
  canManage: boolean;
  onRemove: (sid: string, name: string) => void;
  onEnrolled: () => void;
}) {
  const [students, setStudents] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Enroll search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; email: string; student_code: string }[]
  >([]);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    import('@/lib/api/classes')
      .then(({ listStudents }) => listStudents(classId))
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [classId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedStudent(null);
    try {
      const { listStudents: searchStudents } = await import('@/lib/api/admin');
      const results = await searchStudents(query.trim());
      if (results.length === 0) {
        setSearchError('Không tìm thấy học sinh nào');
      } else if (results.length === 1) {
        setSelectedStudent({ id: results[0].id, name: results[0].name });
      } else {
        setSearchResults(results);
      }
    } catch {
      setSearchError('Tìm kiếm thất bại');
    } finally {
      setSearching(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent) return;
    setEnrolling(true);
    try {
      const { enrollStudent } = await import('@/lib/api/classes');
      const enrollment = await enrollStudent(classId, selectedStudent.id);
      setStudents((prev) => [...prev, enrollment]);
      setQuery('');
      setSelectedStudent(null);
      setSearchResults([]);
      onEnrolled();
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Thêm thất bại');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading)
    return (
      <div className="py-10 text-center text-sm text-gray-400">Đang tải...</div>
    );

  return (
    <div>
      {students.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {students.map((s) => (
            <li
              key={s.student_id}
              className="flex items-center gap-3 px-5 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                  {s.name}
                </p>
                <p className="text-xs text-gray-400">{s.email}</p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(s.enrolled_at).toLocaleDateString('vi-VN')}
              </span>
              {canManage && (
                <button
                  onClick={() => onRemove(s.student_id, s.name)}
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
          Chưa có học sinh nào
        </p>
      )}

      {canManage && (
        <div className="border-t border-gray-100 p-4 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchResults([]);
                setSelectedStudent(null);
                setSearchError(null);
              }}
              placeholder="Tìm theo email hoặc mã học sinh..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              {searching ? '...' : 'Tìm'}
            </button>
          </form>

          {searchError && (
            <p className="mt-2 text-xs text-red-500">{searchError}</p>
          )}

          {searchResults.length > 1 && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedStudent({ id: r.id, name: r.name });
                    setSearchResults([]);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {r.name}
                  </span>
                  <span className="text-gray-400">{r.email}</span>
                  <span className="ml-auto font-mono text-xs text-gray-400">
                    {r.student_code}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <span className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {selectedStudent.name}
              </span>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {enrolling ? '...' : 'Thêm vào lớp'}
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
