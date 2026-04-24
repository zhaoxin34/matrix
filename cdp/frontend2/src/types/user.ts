export interface User {
  id: number;
  username: string;
  phone: string | null;
  email: string | null;
  is_admin?: boolean;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}