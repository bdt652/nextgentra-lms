export interface User {
  id: string;
  email: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  teacher_id: string;
  teacher?: User;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

export interface CourseCreate {
  title: string;
  description?: string;
  status?: 'draft' | 'published';
}

export interface CourseUpdate {
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published' | 'archived';
  teacher_id?: string;
}

export interface CourseListResponse {
  data: Course[];
  meta: PaginationMeta;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order: number;
  video_url?: string;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface LessonCreate {
  title: string;
  content: string;
  order: number;
  video_url?: string;
}

export interface LessonUpdate {
  title?: string;
  content?: string;
  order?: number;
  video_url?: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  points: number;
  created_at: string;
  updated_at: string;
  course?: Course;
  _count?: {
    submissions: number;
  };
}

export interface AssignmentCreate {
  title: string;
  description?: string;
  course_id: string;
  due_date: string;
  points?: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  file_url?: string;
  text?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
  assignment?: Assignment;
  user?: User;
}

export interface SubmissionCreate {
  assignment_id: string;
  text?: string;
}

export interface GradeSubmission {
  grade: number;
  feedback?: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  enrolled_at: string;
  completed_at?: string;
  user?: User;
  course?: Course;
}

export interface EnrollmentCreate {
  course_id: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services?: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

export interface TeacherDashboardStats {
  total_courses: number;
  total_students: number;
  active_assignments: number;
  pending_submissions: number;
  recent_activity: ActivityItem[];
}

export interface StudentDashboardStats {
  enrolled_courses: number;
  completed_courses: number;
  pending_assignments: number;
  average_grade: number;
  upcoming_deadlines: Assignment[];
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'course_enrolled' | 'assignment_submitted' | 'grade_received' | 'course_completed';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CourseExport {
  id: string;
  title: string;
  description: string;
  teacher_name: string;
  student_count: number;
  lesson_count: number;
  assignment_count: number;
  status: string;
  created_at: string;
}

export interface GradeExport {
  student_id: string;
  student_name: string;
  assignment_title: string;
  course_title: string;
  grade: number;
  feedback: string;
  submitted_at: string;
  graded_at: string;
}
