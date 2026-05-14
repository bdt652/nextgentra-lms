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
