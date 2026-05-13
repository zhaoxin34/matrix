import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function UserIcon({ className }: { className?: string }) {
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
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
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
	return (
		<div className="flex min-h-svh">
			{/* Left Panel - Branding */}
			<div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
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
					<form className="space-y-5">
						{/* Username - Optional */}
						<div className="space-y-2">
							<Label htmlFor="username" className="text-sm font-medium">
								用户名
								<span className="text-muted-foreground font-normal ml-1">
									(可选)
								</span>
							</Label>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<UserIcon className="h-4 w-4 text-muted-foreground" />
								</div>
								<Input
									id="username"
									type="text"
									placeholder="用于展示的名称"
									className="pl-10"
								/>
							</div>
						</div>

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
									className="pl-10"
								/>
							</div>
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
										className="pl-3"
									/>
								</div>
								<Button variant="outline" className="shrink-0 min-w-[100px]">
									获取验证码
								</Button>
							</div>
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
									className="pl-10"
								/>
							</div>
							{/* Password Strength Indicator */}
							<div className="space-y-2">
								<div className="flex gap-1">
									<div className="h-1 flex-1 rounded-full bg-muted" />
									<div className="h-1 flex-1 rounded-full bg-muted" />
									<div className="h-1 flex-1 rounded-full bg-muted" />
									<div className="h-1 flex-1 rounded-full bg-muted" />
								</div>
								<p className="text-xs text-muted-foreground">
									密码强度: 请设置包含字母和数字的 8-20 位密码
								</p>
							</div>
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
									className="pl-10"
								/>
							</div>
						</div>

						{/* Terms Agreement */}
						<div className="flex items-start gap-2">
							<input
								type="checkbox"
								id="terms"
								className="mt-0.5 h-4 w-4 rounded border-input"
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
						<Button className="w-full" size="lg">
							注册
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
