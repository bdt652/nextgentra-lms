import type {
  Course,
  CourseDetail,
  Lesson,
  LessonAttachment,
  LessonQuestionItem,
  Section,
} from '../types';
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

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function listCourses(mine = false): Promise<Course[]> {
  const res = await apiFetch(`/courses${mine ? '?mine=true' : ''}`);
  return handleResponse<Course[]>(res);
}

export async function createCourse(data: {
  title: string;
  description?: string;
  cover_image?: string;
}): Promise<Course> {
  const res = await apiFetch('/courses', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Course>(res);
}

export async function getCourse(id: string): Promise<CourseDetail> {
  const res = await apiFetch(`/courses/${id}`);
  return handleResponse<CourseDetail>(res);
}

export async function updateCourse(
  id: string,
  data: {
    title?: string;
    description?: string;
    cover_image?: string;
    is_published?: boolean;
  },
): Promise<Course> {
  const res = await apiFetch(`/courses/${id}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Course>(res);
}

export async function deleteCourse(id: string): Promise<void> {
  const res = await apiFetch(`/courses/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}

export async function togglePublish(id: string): Promise<Course> {
  const res = await apiFetch(`/courses/${id}/publish`, { method: 'POST' });
  return handleResponse<Course>(res);
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function listLessons(courseId: string): Promise<Lesson[]> {
  const res = await apiFetch(`/courses/${courseId}/lessons`);
  return handleResponse<Lesson[]>(res);
}

export async function createLesson(
  courseId: string,
  data: {
    title: string;
    content?: string;
    video_url?: string;
    order?: number;
    section_id?: string | null;
    prerequisite_ids?: string[];
  },
): Promise<Lesson> {
  const res = await apiFetch(`/courses/${courseId}/lessons`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Lesson>(res);
}

export async function getLesson(
  courseId: string,
  lessonId: string,
): Promise<Lesson> {
  const res = await apiFetch(`/courses/${courseId}/lessons/${lessonId}`);
  return handleResponse<Lesson>(res);
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  data: {
    title?: string;
    content?: string;
    video_url?: string;
    order?: number;
    is_published?: boolean;
    section_id?: string | null;
    prerequisite_ids?: string[];
    random_question_count?: number | null;
  },
): Promise<Lesson> {
  const res = await apiFetch(`/courses/${courseId}/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Lesson>(res);
}

export async function deleteLesson(
  courseId: string,
  lessonId: string,
): Promise<void> {
  const res = await apiFetch(`/courses/${courseId}/lessons/${lessonId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

export async function reorderLessons(
  courseId: string,
  items: { id: string; order: number }[],
): Promise<Lesson[]> {
  const res = await apiFetch(`/courses/${courseId}/lessons/reorder`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ items }),
  });
  return handleResponse<Lesson[]>(res);
}

export async function addAttachment(
  courseId: string,
  lessonId: string,
  data: { name: string; file_url: string; file_type: string },
): Promise<LessonAttachment> {
  const res = await apiFetch(
    `/courses/${courseId}/lessons/${lessonId}/attachments`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    },
  );
  return handleResponse<LessonAttachment>(res);
}

export async function deleteAttachment(
  courseId: string,
  lessonId: string,
  attachmentId: string,
): Promise<void> {
  const res = await apiFetch(
    `/courses/${courseId}/lessons/${lessonId}/attachments/${attachmentId}`,
    { method: 'DELETE' },
  );
  return handleResponse<void>(res);
}

// ─── Lesson Questions ─────────────────────────────────────────────────────────

export async function addLessonQuestions(
  courseId: string,
  lessonId: string,
  questionIds: string[],
): Promise<LessonQuestionItem[]> {
  const res = await apiFetch(
    `/courses/${courseId}/lessons/${lessonId}/questions`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ question_ids: questionIds }),
    },
  );
  return handleResponse<LessonQuestionItem[]>(res);
}

export async function removeLessonQuestion(
  courseId: string,
  lessonId: string,
  questionId: string,
): Promise<void> {
  const res = await apiFetch(
    `/courses/${courseId}/lessons/${lessonId}/questions/${questionId}`,
    { method: 'DELETE' },
  );
  return handleResponse<void>(res);
}

export async function reorderLessonQuestions(
  courseId: string,
  lessonId: string,
  items: { id: string; order: number }[],
): Promise<LessonQuestionItem[]> {
  const res = await apiFetch(
    `/courses/${courseId}/lessons/${lessonId}/questions/reorder`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ items }),
    },
  );
  return handleResponse<LessonQuestionItem[]>(res);
}

export async function updateLessonQuestion(
  courseId: string,
  lessonId: string,
  lqId: string,
  data: { is_extension?: boolean; prerequisite_ids?: string[] },
): Promise<LessonQuestionItem> {
  const res = await apiFetch(
    `/courses/${courseId}/lessons/${lessonId}/questions/${lqId}`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    },
  );
  return handleResponse<LessonQuestionItem>(res);
}

// ─── Sections ────────────────────────────────────────────────────────────────

export async function createSection(
  courseId: string,
  data: { title: string; description?: string; order?: number },
): Promise<Section> {
  const res = await apiFetch(`/courses/${courseId}/sections`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Section>(res);
}

export async function updateSection(
  courseId: string,
  sectionId: string,
  data: {
    title?: string;
    description?: string;
    order?: number;
    is_published?: boolean;
  },
): Promise<Section> {
  const res = await apiFetch(`/courses/${courseId}/sections/${sectionId}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Section>(res);
}

export async function deleteSection(
  courseId: string,
  sectionId: string,
): Promise<void> {
  const res = await apiFetch(`/courses/${courseId}/sections/${sectionId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

export async function reorderSections(
  courseId: string,
  items: { id: string; order: number }[],
): Promise<Section[]> {
  const res = await apiFetch(`/courses/${courseId}/sections/reorder`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ items }),
  });
  return handleResponse<Section[]>(res);
}
