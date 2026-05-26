/**
 * Auth Form Schemas
 * Using Zod for form validation
 */

import { z } from "zod";

// ============================================================
// Login Schemas
// ============================================================

export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "请输入手机号")
    .regex(/^1[3-9]\d{9}$/, "请输入正确的11位手机号"),
  password: z.string().min(1, "请输入密码").min(8, "密码至少8位"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================
// SMS Login Schemas
// ============================================================

export const smsLoginSchema = z.object({
  phone: z
    .string()
    .min(1, "请输入手机号")
    .regex(/^1[3-9]\d{9}$/, "请输入正确的11位手机号"),
  code: z.string().min(1, "请输入验证码").length(6, "验证码为6位数字"),
});

export type SmsLoginFormData = z.infer<typeof smsLoginSchema>;

// ============================================================
// Register Schemas
// ============================================================

export const registerSchema = z
  .object({
    phone: z
      .string()
      .min(1, "请输入手机号")
      .regex(/^1[3-9]\d{9}$/, "请输入正确的11位手机号"),
    code: z.string().min(1, "请输入验证码").length(6, "验证码为6位数字"),
    password: z
      .string()
      .min(1, "请设置密码")
      .min(8, "密码至少8位")
      .max(20, "密码最多20位")
      .regex(/[A-Za-z]/, "密码需包含字母")
      .regex(/\d/, "密码需包含数字"),
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================
// Admin User Schemas
// ============================================================

export const createUserSchema = z.object({
  phone: z
    .string()
    .min(1, "请输入手机号")
    .regex(/^1[3-9]\d{9}$/, "请输入正确的11位手机号"),
  username: z.string().min(1, "请输入用户名").max(50, "用户名最多50个字符"),
  email: z.string().min(1, "请输入邮箱").email("请输入正确的邮箱地址"),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(1, "请输入用户名")
    .max(50, "用户名最多50个字符")
    .optional(),
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email("请输入正确的邮箱地址")
    .optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// ============================================================
// Password Strength Utils
// ============================================================

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) {
    return {
      score: 0,
      label: "请设置包含字母和数字的8-20位密码",
      color: "bg-muted",
    };
  }

  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Contains letter
  if (/[A-Za-z]/.test(password)) score++;

  // Contains number
  if (/\d/.test(password)) score++;

  // Contains special char
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 1) {
    return { score: 1, label: "弱", color: "bg-destructive" };
  } else if (score <= 3) {
    return { score: 2, label: "中", color: "bg-yellow-500" };
  } else {
    return { score: 3, label: "强", color: "bg-green-500" };
  }
}
