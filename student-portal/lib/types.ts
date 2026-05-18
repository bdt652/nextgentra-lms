export interface Student {
  id: string;
  email: string;
  name: string;
  student_code: string;
  class: string | null;
  created_at: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  refresh_token: string;
}

export interface ApiError {
  detail: string;
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export interface ClassResponse {
  id: string;
  name: string;
  description: string | null;
  code: string;
  category_id: string | null;
  category: Category | null;
  created_at: string;
  updated_at: string;
  teacher_count: number;
  student_count: number;
}

export interface ClassTeacher {
  teacher_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface ClassExam {
  exam_id: string;
  title: string;
  duration: number | null;
  start_time: string | null;
  end_time: string | null;
  assigned_at: string;
}

export interface ClassDetailResponse extends ClassResponse {
  teachers: ClassTeacher[];
  courses: CourseResponse[];
  exams: ClassExam[];
}

// ---------------------------------------------------------------------------
// Courses & Lessons
// ---------------------------------------------------------------------------

export interface CourseResponse {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  teacher_id: string;
  is_published: boolean;
  category_id: string | null;
  category: Category | null;
  created_at: string;
  updated_at: string;
  lesson_count: number;
}

export interface LessonAttachment {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface LessonResponse {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order: number;
  is_published: boolean;
  course_id: string;
  created_at: string;
  updated_at: string;
  attachments: LessonAttachment[];
}

export interface CourseDetailResponse extends CourseResponse {
  lessons: LessonResponse[];
}
