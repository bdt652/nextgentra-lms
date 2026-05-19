'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePermission } from '@/lib/hooks/usePermission';
import {
  getCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  createLesson,
  deleteLesson,
  updateLesson,
  reorderLessons,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '@/lib/api/courses';
import type { CourseDetail, Lesson, Section } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { Dialog } from '@/components/Dialog';
import { LessonRow } from '@/components/course/LessonRow';
import { SectionBlock } from '@/components/course/SectionBlock';

function getAllLessons(course: CourseDetail): Lesson[] {
  const fromSections = course.sections.flatMap((s) => s.lessons);
  return [...fromSections, ...course.unsectioned_lessons];
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const canUpdate = usePermission('course:update');
  const canDelete = usePermission('course:delete');
  const canCreateLesson = usePermission('lesson:create');
  const canEditLesson = usePermission('lesson:update');
  const canDeleteLesson = usePermission('lesson:delete');

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Course edit dialog
  const [editingCourse, setEditingCourse] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Add section dialog
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [savingSection, setSavingSection] = useState(false);

  // Add lesson dialog
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSectionId, setNewLessonSectionId] = useState<string | null>(
    null
  );
  const [savingLesson, setSavingLesson] = useState(false);

  // Unified drag state for cross-section lesson reordering
  const [dragState, setDragState] = useState<{
    lessonId: string;
    sectionId: string | null;
    idx: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    sectionId: string | null;
    idx: number;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  useEffect(() => {
    getCourse(id)
      .then(setCourse)
      .catch(() => showToast('Không thể tải khóa học', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── course actions ──

  const handleTogglePublish = async () => {
    if (!course) return;
    try {
      const updated = await togglePublish(course.id);
      setCourse({ ...course, ...updated });
      showToast(
        updated.is_published ? 'Đã xuất bản khóa học' : 'Đã ẩn khóa học',
        'success'
      );
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!course || !confirm(`Xóa khóa học "${course.title}"?`)) return;
    try {
      await deleteCourse(course.id);
      router.push('/courses');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const openEdit = () => {
    if (!course) return;
    setEditTitle(course.title);
    setEditDesc(course.description ?? '');
    setEditingCourse(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setSavingEdit(true);
    try {
      const updated = await updateCourse(course.id, {
        title: editTitle,
        description: editDesc || undefined,
      });
      setCourse({ ...course, ...updated });
      setEditingCourse(false);
      showToast('Đã cập nhật', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── section actions ──

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !newSectionTitle.trim()) return;
    setSavingSection(true);
    try {
      const section = await createSection(course.id, {
        title: newSectionTitle.trim(),
      });
      setCourse({ ...course, sections: [...course.sections, section] });
      setNewSectionTitle('');
      setAddingSection(false);
      showToast('Đã thêm section', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingSection(false);
    }
  };

  const handleSectionUpdate = async (updated: Section) => {
    if (!course) return;
    try {
      const result = await updateSection(course.id, updated.id, {
        title: updated.title,
      });
      setCourse({
        ...course,
        sections: course.sections.map((s) =>
          s.id === result.id ? { ...s, ...result } : s
        ),
      });
      showToast('Đã cập nhật section', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    if (!course) return;
    const sections = [...course.sections];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    [sections[index], sections[swapIdx]] = [sections[swapIdx], sections[index]];
    const reordered = sections.map((s, i) => ({ ...s, order: i }));
    setCourse({ ...course, sections: reordered });
    try {
      await reorderSections(
        course.id,
        reordered.map((s) => ({ id: s.id, order: s.order }))
      );
    } catch {
      setCourse({ ...course });
      showToast('Không thể đổi thứ tự', 'error');
    }
  };

  const handleSectionDelete = async (section: Section) => {
    if (
      !course ||
      !confirm(`Xóa section "${section.title}"? Các bài học sẽ không bị xóa.`)
    )
      return;
    try {
      await deleteSection(course.id, section.id);
      const freed = section.lessons;
      setCourse({
        ...course,
        sections: course.sections.filter((s) => s.id !== section.id),
        unsectioned_lessons: [...course.unsectioned_lessons, ...freed],
      });
      showToast('Đã xóa section', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  // ── lesson actions ──

  const openAddLesson = (sectionId: string | null) => {
    setNewLessonSectionId(sectionId);
    setNewLessonTitle('');
    setAddingLesson(true);
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !newLessonTitle.trim()) return;
    setSavingLesson(true);
    try {
      const lesson = await createLesson(course.id, {
        title: newLessonTitle.trim(),
        section_id: newLessonSectionId,
      });
      if (newLessonSectionId) {
        setCourse({
          ...course,
          sections: course.sections.map((s) =>
            s.id === newLessonSectionId
              ? { ...s, lessons: [...s.lessons, lesson] }
              : s
          ),
        });
      } else {
        setCourse({
          ...course,
          unsectioned_lessons: [...course.unsectioned_lessons, lesson],
        });
      }
      setNewLessonTitle('');
      setAddingLesson(false);
      showToast('Đã thêm bài học', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleReorderLessons = async (
    sectionId: string | null,
    lessons: Lesson[]
  ) => {
    if (!course) return;
    if (sectionId !== null) {
      setCourse({
        ...course,
        sections: course.sections.map((s) =>
          s.id === sectionId ? { ...s, lessons } : s
        ),
      });
    } else {
      setCourse({ ...course, unsectioned_lessons: lessons });
    }
    try {
      await reorderLessons(
        course.id,
        lessons.map((l, i) => ({ id: l.id, order: i }))
      );
    } catch {
      getCourse(course.id)
        .then(setCourse)
        .catch(() => {});
      showToast('Không thể đổi thứ tự bài học', 'error');
    }
  };

  const handleLessonDragStart = (
    sectionId: string | null,
    idx: number,
    lessonId: string
  ) => {
    setDragState({ lessonId, sectionId, idx });
  };

  const handleLessonDragOver = (
    e: React.DragEvent,
    sectionId: string | null,
    idx: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget((prev) =>
      prev?.sectionId === sectionId && prev?.idx === idx
        ? prev
        : { sectionId, idx }
    );
  };

  const handleLessonDragEnd = () => {
    setDragState(null);
    setDropTarget(null);
  };

  const handleLessonDrop = async (
    e: React.DragEvent,
    targetSectionId: string | null,
    targetIdx: number
  ) => {
    e.preventDefault();
    if (!dragState || !course) {
      setDragState(null);
      setDropTarget(null);
      return;
    }
    const { sectionId: srcSectionId, idx: srcIdx, lessonId } = dragState;
    setDragState(null);
    setDropTarget(null);

    const getSectionLessons = (secId: string | null): Lesson[] => {
      if (secId === null) return [...course.unsectioned_lessons];
      return [...(course.sections.find((s) => s.id === secId)?.lessons ?? [])];
    };

    const srcArr = getSectionLessons(srcSectionId);
    const [movedLesson] = srcArr.splice(srcIdx, 1);
    if (!movedLesson) return;

    if (srcSectionId === targetSectionId) {
      if (srcIdx === targetIdx) return;
      srcArr.splice(targetIdx, 0, movedLesson);
      await handleReorderLessons(srcSectionId, srcArr);
    } else {
      const tgtArr = getSectionLessons(targetSectionId);
      const insertAt = Math.min(targetIdx, tgtArr.length);
      tgtArr.splice(insertAt, 0, {
        ...movedLesson,
        section_id: targetSectionId,
      });

      const applyArr = (
        c: CourseDetail,
        secId: string | null,
        arr: Lesson[]
      ): CourseDetail => {
        if (secId === null) return { ...c, unsectioned_lessons: arr };
        return {
          ...c,
          sections: c.sections.map((s) =>
            s.id === secId ? { ...s, lessons: arr } : s
          ),
        };
      };
      let newCourse = applyArr(course, srcSectionId, srcArr);
      newCourse = applyArr(newCourse, targetSectionId, tgtArr);
      setCourse(newCourse);

      try {
        await updateLesson(course.id, lessonId, {
          section_id: targetSectionId,
        });
        await reorderLessons(
          course.id,
          tgtArr.map((l, i) => ({ id: l.id, order: i }))
        );
        if (srcArr.length > 0) {
          await reorderLessons(
            course.id,
            srcArr.map((l, i) => ({ id: l.id, order: i }))
          );
        }
      } catch (err) {
        getCourse(course.id)
          .then(setCourse)
          .catch(() => {});
        showToast((err as Error).message, 'error');
      }
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!course || !confirm(`Xóa bài học "${lesson.title}"?`)) return;
    try {
      await deleteLesson(course.id, lesson.id);
      setCourse({
        ...course,
        sections: course.sections.map((s) => ({
          ...s,
          lessons: s.lessons.filter((l) => l.id !== lesson.id),
        })),
        unsectioned_lessons: course.unsectioned_lessons.filter(
          (l) => l.id !== lesson.id
        ),
      });
      showToast('Đã xóa bài học', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handlePrereqChange = async (lesson: Lesson, prereqIds: string[]) => {
    if (!course) return;
    try {
      const updated = await updateLesson(course.id, lesson.id, {
        prerequisite_ids: prereqIds,
      });
      const patchLesson = (l: Lesson) => (l.id === updated.id ? updated : l);
      setCourse({
        ...course,
        sections: course.sections.map((s) => ({
          ...s,
          lessons: s.lessons.map(patchLesson),
        })),
        unsectioned_lessons: course.unsectioned_lessons.map(patchLesson),
      });
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleToggleLessonPublish = async (lesson: Lesson) => {
    if (!course) return;
    const optimistic = { ...lesson, is_published: !lesson.is_published };
    const patchLesson = (l: Lesson) => (l.id === lesson.id ? optimistic : l);
    setCourse({
      ...course,
      sections: course.sections.map((s) => ({
        ...s,
        lessons: s.lessons.map(patchLesson),
      })),
      unsectioned_lessons: course.unsectioned_lessons.map(patchLesson),
    });
    try {
      await updateLesson(course.id, lesson.id, {
        is_published: !lesson.is_published,
      });
    } catch (e) {
      const revert = (l: Lesson) => (l.id === lesson.id ? lesson : l);
      setCourse({
        ...course,
        sections: course.sections.map((s) => ({
          ...s,
          lessons: s.lessons.map(revert),
        })),
        unsectioned_lessons: course.unsectioned_lessons.map(revert),
      });
      showToast((e as Error).message, 'error');
    }
  };

  // ── render ──

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Đang tải...</div>;
  }

  if (!course) {
    return (
      <div className="py-12 text-center text-gray-500">
        Không tìm thấy khóa học.{' '}
        <Link href="/courses" className="text-emerald-600 hover:underline">
          Quay lại
        </Link>
      </div>
    );
  }

  const allLessons = getAllLessons(course);
  const totalLessons =
    course.sections.reduce((n, s) => n + s.lessons.length, 0) +
    course.unsectioned_lessons.length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/courses" className="hover:text-gray-700">
          Khóa học
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {course.title}
        </span>
      </div>

      {/* Course header */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {course.title}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                course.is_published
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {course.is_published ? 'Đã xuất bản' : 'Nháp'}
            </span>
          </div>
          {course.description && (
            <p className="mt-1 text-sm text-gray-500">{course.description}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {course.sections.length} section · {totalLessons} bài học
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {canUpdate && (
            <>
              <button
                onClick={openEdit}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Sửa
              </button>
              <button
                onClick={handleTogglePublish}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                {course.is_published ? 'Ẩn' : 'Xuất bản'}
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Course outline */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {/* outline header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Nội dung khóa học
          </h2>
          <div className="flex gap-2">
            {canCreateLesson && (
              <button
                onClick={() => openAddLesson(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-white dark:border-gray-600 dark:text-gray-300"
              >
                + Bài học
              </button>
            )}
            {canUpdate && (
              <button
                onClick={() => setAddingSection(true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                + Section
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4">
          {course.sections.length === 0 &&
            course.unsectioned_lessons.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-400">
                Chưa có nội dung. Thêm section hoặc bài học để bắt đầu.
              </div>
            )}

          {course.sections.map((section, idx) => (
            <SectionBlock
              key={section.id}
              section={section}
              allLessons={allLessons}
              courseId={course.id}
              isFirst={idx === 0}
              isLast={idx === course.sections.length - 1}
              canEditCourse={canUpdate}
              canCreateLesson={canCreateLesson}
              canEditLesson={canEditLesson}
              canDeleteLesson={canDeleteLesson}
              onSectionUpdate={handleSectionUpdate}
              onSectionDelete={handleSectionDelete}
              onMoveUp={() => handleMoveSection(idx, 'up')}
              onMoveDown={() => handleMoveSection(idx, 'down')}
              onLessonDelete={handleDeleteLesson}
              onLessonPrereqChange={handlePrereqChange}
              onLessonTogglePublish={handleToggleLessonPublish}
              onAddLesson={openAddLesson}
              draggingIdx={
                dragState?.sectionId === section.id ? dragState.idx : null
              }
              overIdx={
                dropTarget?.sectionId === section.id ? dropTarget.idx : null
              }
              onLessonDragStart={(i, lessonId) =>
                handleLessonDragStart(section.id, i, lessonId)
              }
              onLessonDragOver={(e, i) =>
                handleLessonDragOver(e, section.id, i)
              }
              onLessonDrop={(e, i) => handleLessonDrop(e, section.id, i)}
              onLessonDragEnd={handleLessonDragEnd}
            />
          ))}

          {/* Unsectioned lessons */}
          {course.unsectioned_lessons.length > 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
              <div className="border-b border-dashed border-gray-200 px-4 py-3 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Bài học không thuộc section
                </h3>
              </div>
              <ul className="divide-y divide-gray-100 px-2 dark:divide-gray-700">
                {course.unsectioned_lessons.map((lesson, idx) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    allLessons={allLessons}
                    courseId={course.id}
                    canEdit={canEditLesson}
                    canDelete={canDeleteLesson}
                    onDelete={handleDeleteLesson}
                    onPrereqChange={handlePrereqChange}
                    onTogglePublish={handleToggleLessonPublish}
                    dragging={
                      dragState?.sectionId === null && dragState.idx === idx
                    }
                    isOver={
                      dropTarget?.sectionId === null &&
                      dropTarget.idx === idx &&
                      !(dragState?.sectionId === null && dragState.idx === idx)
                    }
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      handleLessonDragStart(null, idx, lesson.id);
                    }}
                    onDragOver={(e) => handleLessonDragOver(e, null, idx)}
                    onDrop={(e) => handleLessonDrop(e, null, idx)}
                    onDragEnd={handleLessonDragEnd}
                  />
                ))}
              </ul>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  handleLessonDragOver(
                    e,
                    null,
                    course.unsectioned_lessons.length
                  );
                }}
                onDrop={(e) =>
                  handleLessonDrop(e, null, course.unsectioned_lessons.length)
                }
                className={`h-2 rounded-b-lg transition ${
                  dropTarget?.sectionId === null &&
                  dropTarget.idx === course.unsectioned_lessons.length
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : ''
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}

      {/* Edit course */}
      <Dialog
        open={editingCourse}
        onClose={() => setEditingCourse(false)}
        title="Sửa khóa học"
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditingCourse(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="edit-course-form"
              disabled={savingEdit}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingEdit ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        }
      >
        <form
          id="edit-course-form"
          onSubmit={handleSaveEdit}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên khóa học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              autoFocus
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </form>
      </Dialog>

      {/* Add section */}
      <Dialog
        open={addingSection}
        onClose={() => {
          setAddingSection(false);
          setNewSectionTitle('');
        }}
        title="Thêm section"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setAddingSection(false);
                setNewSectionTitle('');
              }}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="add-section-form"
              disabled={savingSection || !newSectionTitle.trim()}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingSection ? 'Đang thêm...' : 'Thêm'}
            </button>
          </div>
        }
      >
        <form
          id="add-section-form"
          onSubmit={handleAddSection}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên section <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              required
              autoFocus
              placeholder="Ví dụ: Chương 1 — Giới thiệu"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </form>
      </Dialog>

      {/* Add lesson */}
      <Dialog
        open={addingLesson}
        onClose={() => {
          setAddingLesson(false);
          setNewLessonTitle('');
        }}
        title="Thêm bài học"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setAddingLesson(false);
                setNewLessonTitle('');
              }}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="add-lesson-form"
              disabled={savingLesson || !newLessonTitle.trim()}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingLesson ? 'Đang thêm...' : 'Thêm'}
            </button>
          </div>
        }
      >
        <form
          id="add-lesson-form"
          onSubmit={handleAddLesson}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên bài học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              required
              autoFocus
              placeholder="Tên bài học..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {course.sections.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Thuộc section
              </label>
              <select
                value={newLessonSectionId ?? ''}
                onChange={(e) => setNewLessonSectionId(e.target.value || null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Không thuộc section</option>
                {course.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
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
