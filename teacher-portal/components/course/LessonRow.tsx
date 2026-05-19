'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Lesson } from '@/lib/types';
import { Dialog } from '@/components/Dialog';

export interface LessonRowProps {
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

export function LessonRow({
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
    lesson.prerequisite_ids.includes(l.id),
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
