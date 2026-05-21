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
  reorderCourses,
  assignExam,
  updateClassExam,
  unassignExam,
  reorderExams,
  addTeacher,
  removeTeacher,
  updateTeacherRole,
} from '@/lib/api/classes';
import { useAuthStore } from '@/lib/store/authStore';
import { listCourses } from '@/lib/api/courses';
import { listExams, updateExam } from '@/lib/api/exams';
import type { ClassDetail, ClassExam, Course, Exam } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { Dialog } from '@/components/Dialog';
import { StudentsTab } from './StudentsTab';
import { TeachersTab } from './TeachersTab';
import { EditClassDialog } from './EditClassDialog';

type Tab = 'students' | 'courses' | 'exams' | 'teachers';

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const canUpdate = usePermission('class:update');
  const canManageStudents = usePermission('class:manage_students');
  const canManageCourses = usePermission('class:manage_courses');
  const currentTeacherId = useAuthStore((s) => s.teacher?.id);

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

  // Exam tab state
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);

  // Assign exam dialog
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [createSourceId, setCreateSourceId] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createDuration, setCreateDuration] = useState('');
  const [createPassScore, setCreatePassScore] = useState('');
  const [createShuffle, setCreateShuffle] = useState(false);
  const [createQuestionLimit, setCreateQuestionLimit] = useState('');
  const [createStartTime, setCreateStartTime] = useState('');
  const [createEndTime, setCreateEndTime] = useState('');
  const [creatingExam, setCreatingExam] = useState(false);

  // Edit exam settings dialog
  const [editingClassExam, setEditingClassExam] = useState<ClassExam | null>(
    null,
  );
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editExamDuration, setEditExamDuration] = useState('');
  const [editExamPassScore, setEditExamPassScore] = useState('');
  const [editShuffle, setEditShuffle] = useState(false);
  const [editQuestionLimit, setEditQuestionLimit] = useState('');
  const [savingExamSettings, setSavingExamSettings] = useState(false);

  // Drag-and-drop
  const [dragCourseIdx, setDragCourseIdx] = useState<number | null>(null);
  const [overCourseIdx, setOverCourseIdx] = useState<number | null>(null);
  const [dragExamIdx, setDragExamIdx] = useState<number | null>(null);
  const [overExamIdx, setOverExamIdx] = useState<number | null>(null);

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

  const closeCreateExamDialog = () => {
    setShowCreateExam(false);
    setCreateSourceId('');
    setCreateDisplayName('');
    setCreateDuration('');
    setCreatePassScore('');
    setCreateShuffle(false);
    setCreateQuestionLimit('');
    setCreateStartTime('');
    setCreateEndTime('');
  };

  const handleAssignClassExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cls || !createSourceId) return;
    setCreatingExam(true);
    try {
      if (createDuration || createPassScore) {
        await updateExam(createSourceId, {
          duration: createDuration ? parseInt(createDuration) : undefined,
          pass_score: createPassScore ? parseFloat(createPassScore) : undefined,
        });
      }
      const ce = await assignExam(cls.id, {
        exam_id: createSourceId,
        display_name: createDisplayName.trim() || undefined,
        shuffle_questions: createShuffle,
        question_limit: createQuestionLimit
          ? parseInt(createQuestionLimit)
          : undefined,
        start_time: createStartTime || undefined,
        end_time: createEndTime || undefined,
      });
      setCls((prev) => (prev ? { ...prev, exams: [...prev.exams, ce] } : prev));
      closeCreateExamDialog();
      showToast('Đã gán bài kiểm tra', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setCreatingExam(false);
    }
  };

  const openEditExamSettings = (ce: ClassExam) => {
    setEditingClassExam(ce);
    setEditDisplayName(ce.display_name ?? '');
    setEditExamDuration(ce.duration ? String(ce.duration) : '');
    setEditExamPassScore('');
    setEditShuffle(ce.shuffle_questions);
    setEditQuestionLimit(ce.question_limit ? String(ce.question_limit) : '');
  };

  const handleSaveExamSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassExam || !cls) return;
    setSavingExamSettings(true);
    try {
      if (editExamDuration || editExamPassScore) {
        await updateExam(editingClassExam.exam_id, {
          duration: editExamDuration ? parseInt(editExamDuration) : undefined,
          pass_score: editExamPassScore
            ? parseFloat(editExamPassScore)
            : undefined,
        });
      }
      const updated = await updateClassExam(cls.id, editingClassExam.exam_id, {
        display_name: editDisplayName.trim() || null,
        shuffle_questions: editShuffle,
        question_limit: editQuestionLimit ? parseInt(editQuestionLimit) : null,
      });
      setCls((prev) =>
        prev
          ? {
              ...prev,
              exams: prev.exams.map((e) =>
                e.exam_id === editingClassExam.exam_id ? updated : e,
              ),
            }
          : prev,
      );
      setEditingClassExam(null);
      showToast('Đã cập nhật cài đặt', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingExamSettings(false);
    }
  };

  const handleUnassignExam = async (examId: string) => {
    if (!cls || !confirm('Gỡ bài kiểm tra khỏi lớp?')) return;
    try {
      await unassignExam(cls.id, examId);
      setCls((prev) =>
        prev
          ? { ...prev, exams: prev.exams.filter((e) => e.exam_id !== examId) }
          : prev,
      );
      showToast('Đã gỡ bài kiểm tra', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleAddTeacher = async (
    teacher: { id: string; name: string },
    role: 'assistant' | 'ta',
  ) => {
    if (!cls) return;
    const ct = await addTeacher(cls.id, teacher.id, role);
    setCls((prev) =>
      prev
        ? {
            ...prev,
            teachers: [...prev.teachers, ct],
            teacher_count: prev.teacher_count + 1,
          }
        : prev,
    );
    showToast(`Đã thêm ${ct.name}`, 'success');
  };

  const handleUpdateTeacherRole = async (
    teacherId: string,
    role: 'assistant' | 'ta',
  ) => {
    if (!cls) return;
    const updated = await updateTeacherRole(cls.id, teacherId, role);
    setCls((prev) =>
      prev
        ? {
            ...prev,
            teachers: prev.teachers.map((t) =>
              t.teacher_id === teacherId ? { ...t, role: updated.role } : t,
            ),
          }
        : prev,
    );
    showToast('Đã cập nhật vai trò', 'success');
  };

  const handleDropCourse = async (fromIdx: number, toIdx: number) => {
    if (!cls || fromIdx === toIdx) return;
    const reordered = [...cls.courses];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setCls((prev) => (prev ? { ...prev, courses: reordered } : prev));
    try {
      await reorderCourses(
        cls.id,
        reordered.map((c) => c.id),
      );
    } catch {
      showToast('Không thể lưu thứ tự', 'error');
    }
  };

  const handleDropExam = async (fromIdx: number, toIdx: number) => {
    if (!cls || fromIdx === toIdx) return;
    const reordered = [...cls.exams];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setCls((prev) => (prev ? { ...prev, exams: reordered } : prev));
    try {
      await reorderExams(
        cls.id,
        reordered.map((e) => e.exam_id),
      );
    } catch {
      showToast('Không thể lưu thứ tự', 'error');
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

  const myClassRole =
    cls.teachers.find((t) => t.teacher_id === currentTeacherId)?.role ?? null;
  const isTA = myClassRole === 'ta';
  const canManageTeachers = canUpdate && !isTA;
  const canEditClass = canUpdate && !isTA;
  const canManageStudentsInClass = canManageStudents && !isTA;
  const canManageCoursesInClass = canManageCourses && !isTA;
  const assignedCourseIds = new Set(cls.courses.map((c) => c.id));
  const unassignedCourses = availableCourses.filter(
    (c) => !assignedCourseIds.has(c.id),
  );
  const assignedExamIds = new Set(cls.exams.map((e) => e.exam_id));
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
        {canEditClass && (
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
            { key: 'exams', label: 'Bài kiểm tra' },
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
            canManage={canManageStudentsInClass}
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
                {cls.courses.map((c, i) => (
                  <li
                    key={c.id}
                    draggable={canManageCoursesInClass}
                    onDragStart={() => setDragCourseIdx(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverCourseIdx(i);
                    }}
                    onDrop={() => {
                      if (dragCourseIdx !== null)
                        handleDropCourse(dragCourseIdx, i);
                      setDragCourseIdx(null);
                      setOverCourseIdx(null);
                    }}
                    onDragEnd={() => {
                      setDragCourseIdx(null);
                      setOverCourseIdx(null);
                    }}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                      overCourseIdx === i && dragCourseIdx !== i
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : ''
                    } ${dragCourseIdx === i ? 'opacity-50' : ''}`}
                  >
                    {canManageCoursesInClass && (
                      <span className="cursor-grab select-none text-gray-300 hover:text-gray-500 active:cursor-grabbing">
                        ⠿
                      </span>
                    )}
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
                    {canManageCoursesInClass && (
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
            {canManageCoursesInClass && unassignedCourses.length > 0 && (
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
            {canEditClass && (
              <div className="flex justify-end border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                <button
                  onClick={() => setShowCreateExam(true)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  + Gán bài kiểm tra
                </button>
              </div>
            )}
            {cls.exams.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {cls.exams.map((ce, i) => (
                  <li
                    key={ce.exam_id}
                    draggable={canEditClass}
                    onDragStart={() => setDragExamIdx(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverExamIdx(i);
                    }}
                    onDrop={() => {
                      if (dragExamIdx !== null) handleDropExam(dragExamIdx, i);
                      setDragExamIdx(null);
                      setOverExamIdx(null);
                    }}
                    onDragEnd={() => {
                      setDragExamIdx(null);
                      setOverExamIdx(null);
                    }}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                      overExamIdx === i && dragExamIdx !== i
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : ''
                    } ${dragExamIdx === i ? 'opacity-50' : ''}`}
                  >
                    {canEditClass && (
                      <span className="cursor-grab select-none text-gray-300 hover:text-gray-500 active:cursor-grabbing">
                        ⠿
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        {ce.display_name ?? ce.title}
                      </p>
                      {ce.display_name && (
                        <p className="truncate text-xs text-gray-400">
                          {ce.title}
                        </p>
                      )}
                      <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-400">
                        {ce.duration && <span>{ce.duration} phút</span>}
                        {ce.question_limit && (
                          <span>{ce.question_limit} câu</span>
                        )}
                        {ce.shuffle_questions && <span>Trộn câu</span>}
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
                    {canEditClass && (
                      <>
                        <button
                          onClick={() => openEditExamSettings(ce)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                          Cài đặt
                        </button>
                        <button
                          onClick={() => handleUnassignExam(ce.exam_id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Gỡ
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-400">
                Chưa có bài kiểm tra nào
              </p>
            )}
          </div>
        )}

        {/* Teachers tab */}
        {tab === 'teachers' && (
          <TeachersTab
            teachers={cls.teachers}
            canManage={canManageTeachers}
            onAdd={handleAddTeacher}
            onRemove={handleRemoveTeacher}
            onUpdateRole={
              canManageTeachers ? handleUpdateTeacherRole : undefined
            }
          />
        )}
      </div>

      {/* Assign exam dialog */}
      <Dialog
        open={showCreateExam}
        onClose={closeCreateExamDialog}
        title="Gán bài kiểm tra"
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeCreateExamDialog}
              disabled={creatingExam}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="assign-exam-form"
              disabled={creatingExam || !createSourceId}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {creatingExam ? 'Đang gán...' : 'Gán bài kiểm tra'}
            </button>
          </div>
        }
      >
        <form
          id="assign-exam-form"
          onSubmit={handleAssignClassExam}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Chọn bộ câu hỏi <span className="text-red-500">*</span>
            </label>
            <select
              value={createSourceId}
              onChange={(e) => setCreateSourceId(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Chọn bộ câu hỏi --</option>
              {unassignedExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.question_count} câu)
                </option>
              ))}
            </select>
            {unassignedExams.length === 0 && availableExams.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                Tất cả bộ câu hỏi đã được gán cho lớp này.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={createDisplayName}
              onChange={(e) => setCreateDisplayName(e.target.value)}
              placeholder="Để trống sẽ dùng tên bộ câu hỏi"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Thời gian làm bài (phút)
              </label>
              <input
                type="number"
                value={createDuration}
                onChange={(e) => setCreateDuration(e.target.value)}
                min="1"
                placeholder="60"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Điểm đạt (%)
              </label>
              <input
                type="number"
                value={createPassScore}
                onChange={(e) => setCreatePassScore(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                placeholder="70"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số câu hiển thị
              </label>
              <input
                type="number"
                value={createQuestionLimit}
                onChange={(e) => setCreateQuestionLimit(e.target.value)}
                min="1"
                placeholder="Tất cả câu"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={createShuffle}
                  onChange={(e) => setCreateShuffle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                />
                Trộn thứ tự câu hỏi
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Thời gian bắt đầu
              </label>
              <input
                type="datetime-local"
                value={createStartTime}
                onChange={(e) => setCreateStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Thời gian kết thúc
              </label>
              <input
                type="datetime-local"
                value={createEndTime}
                onChange={(e) => setCreateEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* Edit exam settings dialog */}
      <Dialog
        open={!!editingClassExam}
        onClose={() => setEditingClassExam(null)}
        title={`Cài đặt: ${editingClassExam?.title ?? ''}`}
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditingClassExam(null)}
              disabled={savingExamSettings}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="edit-exam-settings-form"
              disabled={savingExamSettings}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingExamSettings ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        }
      >
        <form
          id="edit-exam-settings-form"
          onSubmit={handleSaveExamSettings}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              autoFocus
              placeholder="Để trống sẽ dùng tên bộ câu hỏi"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Thời gian làm bài (phút)
              </label>
              <input
                type="number"
                value={editExamDuration}
                onChange={(e) => setEditExamDuration(e.target.value)}
                min="1"
                placeholder="60"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Điểm đạt (%)
              </label>
              <input
                type="number"
                value={editExamPassScore}
                onChange={(e) => setEditExamPassScore(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                placeholder="70"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số câu hiển thị
              </label>
              <input
                type="number"
                value={editQuestionLimit}
                onChange={(e) => setEditQuestionLimit(e.target.value)}
                min="1"
                placeholder="Tất cả câu"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={editShuffle}
                  onChange={(e) => setEditShuffle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                />
                Trộn thứ tự câu hỏi
              </label>
            </div>
          </div>
        </form>
      </Dialog>

      <EditClassDialog
        open={editing}
        onClose={() => setEditing(false)}
        editName={editName}
        onEditNameChange={setEditName}
        editDesc={editDesc}
        onEditDescChange={setEditDesc}
        onSubmit={handleSaveEdit}
        saving={savingEdit}
      />

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
