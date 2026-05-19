'use client';

import { useEffect, useRef, useState } from 'react';
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

// ─── helpers ────────────────────────────────────────────────────────────────

function getAllLessons(course: CourseDetail): Lesson[] {
  const fromSections = course.sections.flatMap((s) => s.lessons);
  return [...fromSections, ...course.unsectioned_lessons];
}

// ─── sub-components ─────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: Lesson;
  allLessons: Lesson[];
  courseId: string;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (lesson: Lesson) => void;
  onPrereqChange: (lesson: Lesson, prereqIds: string[]) => void;
  onTogglePublish: (lesson: Lesson) => void;
  dragging?: boolean;
  isOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

function LessonRow({
  lesson,
  allLessons,
  courseId,
  canEdit,
  canDelete,
  onDelete,
  onPrereqChange,
  onTogglePublish,
  dragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: LessonRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [prereqOpen, setPrereqOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const prereqLessons = allLessons.filter((l) =>
    lesson.prerequisite_ids.includes(l.id)
  );
  const candidatePrereqs = allLessons.filter((l) => l.id !== lesson.id);

  const togglePrereq = (id: string) => {
    const next = lesson.prerequisite_ids.includes(id)
      ? lesson.prerequisite_ids.filter((p) => p !== id)
      : [...lesson.prerequisite_ids, id];
    onPrereqChange(lesson, next);
  };

  return (
    <>
      <li
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-opacity ${
          dragging ? 'opacity-40' : ''
        } ${isOver ? 'ring-2 ring-emerald-400 ring-inset' : ''}`}
      >
        {/* drag handle */}
        <span
          className={`select-none text-gray-300 ${onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          ⠿
        </span>

        {/* lesson icon */}
        <span className="text-base">{lesson.video_url ? '🎬' : '📄'}</span>

        {/* title + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
            {lesson.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {lesson.attachments.length > 0 && (
              <span className="text-xs text-gray-400">
                {lesson.attachments.length} file
              </span>
            )}
            {prereqLessons.length > 0 && (
              <span
                title={`Yêu cầu: ${prereqLessons.map((l) => l.title).join(', ')}`}
                className="flex items-center gap-1 text-xs text-amber-600"
              >
                🔒{' '}
                {prereqLessons.length === 1
                  ? prereqLessons[0].title
                  : `${prereqLessons.length} điều kiện`}
              </span>
            )}
          </div>
        </div>

        {/* published badge */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
            lesson.is_published
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-gray-50 text-gray-400'
          }`}
        >
          {lesson.is_published ? 'Đã xuất bản' : 'Nháp'}
        </span>

        {/* quick publish toggle */}
        {canEdit && (
          <button
            onClick={() => onTogglePublish(lesson)}
            title={lesson.is_published ? 'Chuyển về nháp' : 'Xuất bản'}
            className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs transition ${
              lesson.is_published
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-gray-200 text-gray-400 hover:bg-gray-50 dark:border-gray-600'
            }`}
          >
            {lesson.is_published ? '✓ Xuất bản' : 'Nháp'}
          </button>
        )}

        {/* edit link */}
        {canEdit && (
          <Link
            href={`/courses/${courseId}/lessons/${lesson.id}`}
            className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            Sửa
          </Link>
        )}

        {/* more menu */}
        {(canEdit || canDelete) && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-600"
            >
              ···
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                {canEdit && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setPrereqOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🔒 Đặt điều kiện tiên quyết
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(lesson);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                  >
                    🗑 Xóa bài học
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </li>

      {/* prerequisite dialog */}
      <Dialog
        open={prereqOpen}
        onClose={() => setPrereqOpen(false)}
        title="Điều kiện tiên quyết"
        size="lg"
        footer={
          <button
            onClick={() => setPrereqOpen(false)}
            className="w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Đóng
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Chọn một hoặc nhiều bài học phải hoàn thành trước khi học{' '}
            <strong className="text-gray-800 dark:text-gray-100">
              {lesson.title}
            </strong>
            .
          </p>
          {candidatePrereqs.length === 0 ? (
            <p className="text-xs text-gray-400">Không có bài học nào khác.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
              {candidatePrereqs.map((l, idx) => {
                const checked = lesson.prerequisite_ids.includes(l.id);
                return (
                  <label
                    key={l.id}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      idx > 0
                        ? 'border-t border-gray-100 dark:border-gray-700'
                        : ''
                    } ${checked ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePrereq(l.id)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                    />
                    <span
                      className={
                        checked
                          ? 'font-medium text-emerald-700 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }
                    >
                      {l.title}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {lesson.prerequisite_ids.length > 0 && (
            <button
              onClick={() => onPrereqChange(lesson, [])}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Xóa tất cả điều kiện
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
}

// ─── section block ───────────────────────────────────────────────────────────

interface SectionBlockProps {
  section: Section;
  allLessons: Lesson[];
  courseId: string;
  isFirst: boolean;
  isLast: boolean;
  canEditCourse: boolean;
  canCreateLesson: boolean;
  canEditLesson: boolean;
  canDeleteLesson: boolean;
  onSectionUpdate: (section: Section) => void;
  onSectionDelete: (section: Section) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onLessonDelete: (lesson: Lesson) => void;
  onLessonPrereqChange: (lesson: Lesson, prereqIds: string[]) => void;
  onLessonTogglePublish: (lesson: Lesson) => void;
  onAddLesson: (sectionId: string) => void;
  // drag props (page-level controlled)
  draggingIdx: number | null;
  overIdx: number | null;
  onLessonDragStart: (idx: number, lessonId: string) => void;
  onLessonDragOver: (e: React.DragEvent, idx: number) => void;
  onLessonDrop: (e: React.DragEvent, idx: number) => void;
  onLessonDragEnd: () => void;
}

function SectionBlock({
  section,
  allLessons,
  courseId,
  isFirst,
  isLast,
  canEditCourse,
  canCreateLesson,
  canEditLesson,
  canDeleteLesson,
  onSectionUpdate,
  onSectionDelete,
  onMoveUp,
  onMoveDown,
  onLessonDelete,
  onLessonPrereqChange,
  onLessonTogglePublish,
  onAddLesson,
  draggingIdx,
  overIdx,
  onLessonDragStart,
  onLessonDragOver,
  onLessonDrop,
  onLessonDragEnd,
}: SectionBlockProps) {
  const [collapsed, setCollapsed] = useState(false);

  const makeDragProps = (idx: number, lessonId: string) => ({
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      onLessonDragStart(idx, lessonId);
    },
    onDragOver: (e: React.DragEvent) => onLessonDragOver(e, idx),
    onDrop: (e: React.DragEvent) => onLessonDrop(e, idx),
    onDragEnd: onLessonDragEnd,
  });
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(section.title);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  const saveTitle = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== section.title) {
      onSectionUpdate({ ...section, title: trimmed });
    } else {
      setDraftTitle(section.title);
    }
    setEditingTitle(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* section header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-gray-400 hover:text-gray-600"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? '▶' : '▼'}
        </button>

        {editingTitle ? (
          <input
            ref={titleRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') {
                setDraftTitle(section.title);
                setEditingTitle(false);
              }
            }}
            className="flex-1 rounded-md border border-emerald-400 bg-transparent px-2 py-0.5 text-sm font-semibold text-gray-800 focus:outline-none dark:text-white"
          />
        ) : (
          <h3
            className="flex-1 text-sm font-semibold text-gray-800 dark:text-white"
            onDoubleClick={() => canEditCourse && setEditingTitle(true)}
            title={canEditCourse ? 'Double-click để đổi tên' : undefined}
          >
            {section.title}
          </h3>
        )}

        <span className="text-xs text-gray-400">
          {section.lessons.length} bài
        </span>

        {canEditCourse && (
          <>
            <div className="flex items-center">
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700"
                title="Lên trên"
              >
                ▲
              </button>
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700"
                title="Xuống dưới"
              >
                ▼
              </button>
            </div>
            <button
              onClick={() => setEditingTitle(true)}
              className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              title="Đổi tên section"
            >
              ✏️
            </button>
            <button
              onClick={() => onSectionDelete(section)}
              className="rounded p-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
              title="Xóa section"
            >
              🗑
            </button>
          </>
        )}
      </div>

      {/* lessons */}
      {!collapsed && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {section.lessons.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                onLessonDragOver(e, 0);
              }}
              onDrop={(e) => onLessonDrop(e, 0)}
              className={`px-4 py-4 text-center text-xs text-gray-400 transition ${
                overIdx === 0
                  ? 'rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                  : ''
              }`}
            >
              Chưa có bài học trong section này
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100 px-2 dark:divide-gray-700">
                {section.lessons.map((lesson, idx) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    allLessons={allLessons}
                    courseId={courseId}
                    canEdit={canEditLesson}
                    canDelete={canDeleteLesson}
                    onDelete={onLessonDelete}
                    onPrereqChange={onLessonPrereqChange}
                    onTogglePublish={onLessonTogglePublish}
                    dragging={draggingIdx === idx}
                    isOver={overIdx === idx && draggingIdx !== idx}
                    {...makeDragProps(idx, lesson.id)}
                  />
                ))}
              </ul>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  onLessonDragOver(e, section.lessons.length);
                }}
                onDrop={(e) => onLessonDrop(e, section.lessons.length)}
                className={`h-2 rounded-b-lg transition ${
                  overIdx === section.lessons.length
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : ''
                }`}
              />
            </>
          )}

          {canCreateLesson && (
            <div className="px-4 py-2">
              <button
                onClick={() => onAddLesson(section.id)}
                className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-600"
              >
                + Thêm bài học
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

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
          {/* Sections */}
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
