export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  phone?: string
}
