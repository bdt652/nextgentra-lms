import { apiFetch } from './client';

export type ImportResult = {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export type TeacherImportRow = {
  email: string;
  name: string;
  password: string;
  role: string;
};

export type StudentImportRow = {
  email: string;
  name: string;
  student_code: string;
  password: string;
};

export type QuestionImportRow = {
  content: string;
  type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: string;
};

export type ClassStudentImportRow = {
  student_code: string;
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function handleResponse(res: Response): Promise<ImportResult> {
  if (!res.ok) {
    const err: { detail: string } = await res
      .json()
      .catch(() => ({ detail: 'Đã có lỗi xảy ra' }));
    throw new Error(err.detail || 'Đã có lỗi xảy ra');
  }
  return res.json();
}

export async function importTeachers(
  rows: TeacherImportRow[],
): Promise<ImportResult> {
  const res = await apiFetch('/admin/teachers/import', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ rows }),
  });
  return handleResponse(res);
}

export async function importStudents(
  rows: StudentImportRow[],
): Promise<ImportResult> {
  const res = await apiFetch('/admin/students/import', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ rows }),
  });
  return handleResponse(res);
}

export async function importQuestions(
  examId: string,
  rows: QuestionImportRow[],
): Promise<ImportResult> {
  const res = await apiFetch(`/exams/${examId}/questions/import`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      rows: rows.map((r) => ({
        ...r,
        points: parseFloat(r.points) || 1,
      })),
    }),
  });
  return handleResponse(res);
}

export async function importClassStudents(
  classId: string,
  rows: ClassStudentImportRow[],
): Promise<ImportResult> {
  const res = await apiFetch(`/classes/${classId}/students/import`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ rows }),
  });
  return handleResponse(res);
}
