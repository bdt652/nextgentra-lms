import type {
  ClassDetailResponse,
  ClassResponse,
  CourseDetailResponse,
  CourseResponse,
  LessonResponse,
} from '../types';
import { apiFetch } from './client';

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `Lỗi ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const getMyClasses = () =>
  apiFetch('/student/classes').then(handleJson<ClassResponse[]>);

export const getClassDetail = (id: string) =>
  apiFetch(`/student/classes/${id}`).then(handleJson<ClassDetailResponse>);

export const getClassCourses = (id: string) =>
  apiFetch(`/student/classes/${id}/courses`).then(handleJson<CourseResponse[]>);

export const getCourseDetail = (id: string) =>
  apiFetch(`/student/courses/${id}`).then(handleJson<CourseDetailResponse>);

export const getLesson = (courseId: string, lessonId: string) =>
  apiFetch(`/student/courses/${courseId}/lessons/${lessonId}`).then(
    handleJson<LessonResponse>,
  );
