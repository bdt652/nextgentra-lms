export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
}

export interface ApiError {
  detail: string;
}
