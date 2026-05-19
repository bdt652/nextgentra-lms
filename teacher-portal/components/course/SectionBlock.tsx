'use client';

import { useEffect, useRef, useState } from 'react';
import type { Lesson, Section } from '@/lib/types';
import { LessonRow } from './LessonRow';

export interface SectionBlockProps {
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

export function SectionBlock({
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

  const makeDragProps = (idx: number, lessonId: string) => ({
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      onLessonDragStart(idx, lessonId);
    },
    onDragOver: (e: React.DragEvent) => onLessonDragOver(e, idx),
    onDrop: (e: React.DragEvent) => onLessonDrop(e, idx),
    onDragEnd: onLessonDragEnd,
  });

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
