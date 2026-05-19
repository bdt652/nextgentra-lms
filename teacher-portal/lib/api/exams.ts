import type { Exam, ExamDetail, Question, QuestionType } from '../types';
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

// ─── Exams ───────────────────────────────────────────────────────────────────

export async function listExams(mine = false): Promise<Exam[]> {
  const res = await apiFetch(`/exams${mine ? '?mine=true' : ''}`);
  return handleResponse<Exam[]>(res);
}

export async function createExam(data: {
  title: string;
  description?: string;
  duration?: number;
  pass_score?: number;
}): Promise<Exam> {
  const res = await apiFetch('/exams', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Exam>(res);
}

export async function getExam(id: string): Promise<ExamDetail> {
  const res = await apiFetch(`/exams/${id}`);
  return handleResponse<ExamDetail>(res);
}

export async function updateExam(
  id: string,
  data: {
    title?: string;
    description?: string;
    duration?: number;
    pass_score?: number;
  },
): Promise<Exam> {
  const res = await apiFetch(`/exams/${id}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Exam>(res);
}

export async function deleteExam(id: string): Promise<void> {
  const res = await apiFetch(`/exams/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}

// ─── Questions ───────────────────────────────────────────────────────────────

export async function addQuestion(
  examId: string,
  data: {
    content: string;
    type: QuestionType;
    options?: unknown;
    correct_answer?: string;
    code_template?: string;
    test_cases?: unknown;
    points?: number;
    order?: number;
  },
): Promise<Question> {
  const res = await apiFetch(`/exams/${examId}/questions`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Question>(res);
}

export async function updateQuestion(
  examId: string,
  questionId: string,
  data: {
    content?: string;
    type?: QuestionType;
    options?: unknown;
    correct_answer?: string;
    code_template?: string;
    test_cases?: unknown;
    points?: number;
    order?: number;
  },
): Promise<Question> {
  const res = await apiFetch(`/exams/${examId}/questions/${questionId}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
  return handleResponse<Question>(res);
}

export async function deleteQuestion(
  examId: string,
  questionId: string,
): Promise<void> {
  const res = await apiFetch(`/exams/${examId}/questions/${questionId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}

export async function reorderQuestions(
  examId: string,
  items: { id: string; order: number }[],
): Promise<Question[]> {
  const res = await apiFetch(`/exams/${examId}/questions/reorder`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ items }),
  });
  return handleResponse<Question[]>(res);
}
