const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function login(
  email: string,
  password: string
): Promise<{
  access_token: string;
  token_type: string;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error: { detail: string } = await response.json();
    throw new Error(error.detail || 'Đăng nhập thất bại');
  }

  return response.json();
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: 'student' | 'teacher'
): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, role }),
  });

  if (!response.ok) {
    const error: { detail: string } = await response.json();
    throw new Error(error.detail || 'Đăng ký thất bại');
  }

  return response.json();
}
