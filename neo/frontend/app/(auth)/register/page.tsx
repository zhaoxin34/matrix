"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  registerSchema,
  type RegisterFormData,
  getPasswordStrength,
} from "@/schemas/auth";
import { register, getErrorMessage } from "@/lib/api/auth";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useSendCode } from "@/hooks/use-send-code";

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { login: setAuthUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const phone = watch("phone");
  const passwordStrength = getPasswordStrength(password);

  const {
    isLoading: isSendingCode,
    countdown,
    isCountingDown,
    send: sendCode,
    error: codeError,
  } = useSendCode({
    phone,
    type: "register",
    onSuccess: () => {
      toast.success("验证码已发送");
    },
    onError: (message) => {
      toast.error(message);
    },
  });

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      toast.error("请输入正确的11位手机号");
      return;
    }
    await sendCode();
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!agreedToTerms) {
      toast.error("请阅读并同意服务条款和隐私政策");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        phone: data.phone,
        code: data.code,
        password: data.password,
      });

      if (response.code === 0) {
        setAuthUser(response.data);
        toast.success("注册成功");
        router.push("/workspace/list");
      } else {
        const message = getErrorMessage(response.code);
        toast.error(message);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "注册失败，请稍后重试";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
              <LogoIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">
              Neo 系统
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            加入我们
            <br />
            开启智能协作之旅
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            注册只需几步，即可体验全新的智能协作平台，提升团队工作效率。
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                <CheckCircleIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/90">
                快速注册，仅需手机号验证
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                <CheckCircleIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/90">
                支持多项目管理与协作
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                <CheckCircleIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/90">
                企业级数据安全保护
              </span>
            </div>
          </div>
        </div>

        <div className="text-sm text-primary-foreground/40">
          © 2026 Neo 系统. 保留所有权利.
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <LogoIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Neo 系统</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">创建账号</h2>
            <p className="text-muted-foreground">填写以下信息完成注册</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                手机号
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入 11 位手机号"
                  maxLength={11}
                  data-testid="inp-phone"
                  className="pl-10"
                  {...registerField("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Verification Code */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                验证码
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="code"
                    type="text"
                    placeholder="请输入 6 位验证码"
                    maxLength={6}
                    data-testid="inp-code"
                    className="pl-3"
                    {...registerField("code")}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 min-w-[100px]"
                  onClick={handleSendCode}
                  disabled={isSendingCode || isCountingDown}
                  data-testid="btn-send-code"
                >
                  {isCountingDown ? `${countdown}秒` : "获取验证码"}
                </Button>
              </div>
              {codeError && (
                <p className="text-xs text-destructive">{codeError}</p>
              )}
              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                验证码有效期 5 分钟，如有异常请重新获取
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                设置密码
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="8-20 位，需包含字母和数字"
                  data-testid="inp-password"
                  className="pl-10"
                  {...registerField("password")}
                />
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength.score >= 1
                          ? passwordStrength.color
                          : "bg-muted"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength.score >= 2
                          ? passwordStrength.color
                          : "bg-muted"
                      }`}
                    />
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        passwordStrength.score >= 3
                          ? passwordStrength.color
                          : "bg-muted"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    密码强度: {passwordStrength.label}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                确认密码
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="请再次输入密码"
                  data-testid="inp-confirm-password"
                  className="pl-10"
                  {...registerField("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input cursor-pointer"
              />
              <Label
                htmlFor="terms"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                我已阅读并同意{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  服务条款
                </Link>
                {" 和 "}
                <Link href="/privacy" className="text-primary hover:underline">
                  隐私政策
                </Link>
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
              data-testid="btn-register"
            >
              {isSubmitting ? "注册中..." : "注册"}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            已有账号？{" "}
            <Link href="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
