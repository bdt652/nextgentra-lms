export type Permission = string;

export interface Teacher {
  id: string;
  email: string;
  name: string;
  role: string | null;
  permissions: string[];
  created_at: string;
  is_active: boolean;
}

export interface TeacherAdmin {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  role_id: string | null;
  role: string | null;
  permissions: string[];
}

export interface PermissionDef {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionDef[];
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  refresh_token: string;
}

export interface ApiError {
  detail: string;
}

// ─── Courses & Lessons ───────────────────────────────────────────────────────

export type LessonType = 'lecture' | 'quiz' | 'assignment' | 'document';

export interface LessonAttachment {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface LessonQuestionItem {
  id: string;
  lesson_id: string;
  question_id: string;
  order: number;
  is_extension: boolean;
  prerequisite_ids: string[];
  created_at: string;
  question: {
    id: string;
    content: string;
    type: string;
    points: number;
    exam_id: string;
    exam_title: string | null;
  };
}

export interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  lesson_type: LessonType;
  order: number;
  is_published: boolean;
  random_question_count: number | null;
  course_id: string;
  section_id: string | null;
  prerequisite_ids: string[];
  created_at: string;
  updated_at: string;
  attachments: LessonAttachment[];
  lesson_questions: LessonQuestionItem[];
}

export interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  course_id: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  teacher_id: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  lesson_count: number;
}

export interface CourseDetail extends Course {
  sections: Section[];
  unsectioned_lessons: Lesson[];
}

// ─── Exams & Questions ───────────────────────────────────────────────────────

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'essay'
  | 'code'
  | 'fill_blank'
  | 'matching';

export interface Question {
  id: string;
  exam_id: string;
  content: string;
  type: QuestionType;
  options: unknown | null;
  correct_answer: string | null;
  code_template: string | null;
  test_cases: unknown | null;
  points: number;
  order: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  duration: number | null;
  pass_score: number | null;
  created_at: string;
  updated_at: string;
  question_count: number;
}

export interface ExamDetail extends Exam {
  questions: Question[];
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export interface ClassTeacher {
  teacher_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface ClassEnrollment {
  student_id: string;
  name: string;
  email: string;
  enrolled_at: string;
}

export interface ClassExam {
  exam_id: string;
  title: string;
  duration: number | null;
  start_time: string | null;
  end_time: string | null;
  assigned_at: string;
}

export interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
  updated_at: string;
  teacher_count: number;
  student_count: number;
}

export interface ClassDetail extends ClassItem {
  teachers: ClassTeacher[];
  courses: Course[];
  exams: ClassExam[];
}

// ─── Students ─────────────────────────────────────────────────────────────────

export interface StudentAdmin {
  id: string;
  email: string;
  name: string;
  student_code: string;
  is_active: boolean;
  created_at: string;
}
