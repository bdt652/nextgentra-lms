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

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  refresh_token: string;
}

export interface ApiError {
  detail: string;
}
