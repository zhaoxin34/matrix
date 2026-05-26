import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
        fill="currentColor"
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

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
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
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
              <svg
                className="h-6 w-6 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-primary-foreground">
              Neo 系统
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            智能协作平台
            <br />
            让工作更高效
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            整合团队、项目和数据的一体化解决方案，助力企业实现数字化转型。
          </p>

          <div className="flex gap-8 pt-4">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary-foreground">
                500+
              </div>
              <div className="text-sm text-primary-foreground/60">企业用户</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary-foreground">
                99.9%
              </div>
              <div className="text-sm text-primary-foreground/60">
                服务可用性
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary-foreground">
                24/7
              </div>
              <div className="text-sm text-primary-foreground/60">技术支持</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-primary-foreground/40">
          © 2026 Neo 系统. 保留所有权利.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <svg
                className="h-6 w-6 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold">Neo 系统</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">欢迎回来</h2>
            <p className="text-muted-foreground">
              请输入您的手机号和密码登录系统
            </p>
          </div>

          {/* Login Method Toggle */}
          <RadioGroup
            defaultValue="password"
            className="grid grid-cols-2 gap-4 rounded-lg border p-1"
          >
            <RadioGroupItem
              value="password"
              id="password-login"
              className="hidden"
            />
            <Label
              htmlFor="password-login"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=unchecked]:hover:bg-muted"
            >
              <LockIcon className="h-4 w-4" />
              密码登录
            </Label>

            <RadioGroupItem value="sms" id="sms-login" className="hidden" />
            <Label
              htmlFor="sms-login"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:hover:bg-muted"
            >
              <PhoneIcon className="h-4 w-4" />
              验证码登录
            </Label>
          </RadioGroup>

          {/* Login Form */}
          <form className="space-y-6">
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
                  placeholder="请输入手机号"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2" data-password-field>
              <Label htmlFor="password" className="text-sm font-medium">
                密码
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* SMS Code Field - Hidden by default */}
            <div className="space-y-2 hidden" data-sms-field>
              <Label htmlFor="code" className="text-sm font-medium">
                验证码
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="code"
                    type="text"
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="pl-3"
                  />
                </div>
                <Button variant="outline" className="shrink-0">
                  获取验证码
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                验证码将在 60 秒后过期
              </p>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-muted-foreground">记住我</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                忘记密码？
              </Link>
            </div>

            {/* Submit Button */}
            <Button className="w-full" size="lg">
              登录
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                其他登录方式
              </span>
            </div>
          </div>

          {/* SSO Button */}
          <Button variant="outline" className="w-full" size="lg">
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            企业 SSO 登录
          </Button>

          {/* Register Link */}
          <p className="text-center text-sm text-muted-foreground">
            还没有账号？{" "}
            <Link href="/register" className="text-primary hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
