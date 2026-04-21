export interface User {
  id: number;
  username: string;
  phone: string | null;
  email: string | null;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  phone: string;
  password: string;
}
