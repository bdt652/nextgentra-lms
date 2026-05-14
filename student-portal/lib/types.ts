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

export interface Course {
  id: string;
  name: string;
  teacher_name: string;
  description: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  enrolled_at: string;
}
