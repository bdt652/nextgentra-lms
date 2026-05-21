import type {
  ClassDetail,
  ClassEnrollment,
  ClassExam,
  ClassItem,
  ClassTeacher,
  Course,
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

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function listClasses(): Promise<ClassItem[]> {
  const res = await apiFetch('/classes');
  return handleResponse<ClassItem[]>(res);
}

export async function createClass(data: {
  name: string;
  description?: string;
}): Promise<ClassItem> {
  const res = await apiFetch('/classes', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<ClassItem>(res);
}

export async function getClass(id: string): Promise<ClassDetail> {
  const res = await apiFetch(`/classes/${id}`);
  return handleResponse<ClassDetail>(res);
}

export async function updateClass(
  id: string,
  data: { name?: string; description?: string },
): Promise<ClassItem> {
  const res = await apiFetch(`/classes/${id}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<ClassItem>(res);
}

export async function deleteClass(id: string): Promise<void> {
  const res = await apiFetch(`/classes/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}

// ─── Teachers ────────────────────────────────────────────────────────────────

export async function listClassTeachers(
  classId: string,
): Promise<ClassTeacher[]> {
  const res = await apiFetch(`/classes/${classId}/teachers`);
  return handleResponse<ClassTeacher[]>(res);
}

export async function addTeacher(
  classId: string,
  teacherId: string,
  role = 'assistant',
): Promise<ClassTeacher> {
  const res = await apiFetch(`/classes/${classId}/teachers`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ teacher_id: teacherId, role }),
  });
  return handleResponse<ClassTeacher>(res);
}

export async function removeTeacher(
  classId: string,
  teacherId: string,
): Promise<void> {
  const res = await apiFetch(`/classes/${classId}/teachers/${teacherId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

export async function updateTeacherRole(
  classId: string,
  teacherId: string,
  role: 'assistant' | 'ta',
): Promise<ClassTeacher> {
  const res = await apiFetch(`/classes/${classId}/teachers/${teacherId}/role`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ role }),
  });
  return handleResponse<ClassTeacher>(res);
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function listStudents(
  classId: string,
): Promise<ClassEnrollment[]> {
  const res = await apiFetch(`/classes/${classId}/students`);
  return handleResponse<ClassEnrollment[]>(res);
}

export async function enrollStudent(
  classId: string,
  studentId: string,
): Promise<ClassEnrollment> {
  const res = await apiFetch(`/classes/${classId}/students`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ student_id: studentId }),
  });
  return handleResponse<ClassEnrollment>(res);
}

export async function removeStudent(
  classId: string,
  studentId: string,
): Promise<void> {
  const res = await apiFetch(`/classes/${classId}/students/${studentId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function listClassCourses(classId: string): Promise<Course[]> {
  const res = await apiFetch(`/classes/${classId}/courses`);
  return handleResponse<Course[]>(res);
}

export async function assignCourse(
  classId: string,
  courseId: string,
): Promise<Course> {
  const res = await apiFetch(`/classes/${classId}/courses`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ course_id: courseId }),
  });
  return handleResponse<Course>(res);
}

export async function unassignCourse(
  classId: string,
  courseId: string,
): Promise<void> {
  const res = await apiFetch(`/classes/${classId}/courses/${courseId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export async function listClassExams(classId: string): Promise<ClassExam[]> {
  const res = await apiFetch(`/classes/${classId}/exams`);
  return handleResponse<ClassExam[]>(res);
}

export async function assignExam(
  classId: string,
  data: {
    exam_id: string;
    display_name?: string;
    shuffle_questions?: boolean;
    question_limit?: number;
    start_time?: string;
    end_time?: string;
  },
): Promise<ClassExam> {
  const res = await apiFetch(`/classes/${classId}/exams`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<ClassExam>(res);
}

export async function updateClassExam(
  classId: string,
  examId: string,
  data: {
    display_name?: string | null;
    shuffle_questions?: boolean;
    question_limit?: number | null;
    start_time?: string | null;
    end_time?: string | null;
  },
): Promise<ClassExam> {
  const res = await apiFetch(`/classes/${classId}/exams/${examId}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<ClassExam>(res);
}

export async function unassignExam(
  classId: string,
  examId: string,
): Promise<void> {
  const res = await apiFetch(`/classes/${classId}/exams/${examId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

export async function reorderCourses(
  classId: string,
  ids: string[],
): Promise<void> {
  const res = await apiFetch(`/classes/${classId}/courses/reorder`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ ids }),
  });
  return handleResponse<void>(res);
}

export async function reorderExams(
  classId: string,
  ids: string[],
): Promise<void> {
  const res = await apiFetch(`/classes/${classId}/exams/reorder`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ ids }),
  });
  return handleResponse<void>(res);
}
