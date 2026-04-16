export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0
}
