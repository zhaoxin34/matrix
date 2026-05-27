// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
	code: number;
	message: string;
	data: T;
	traceId: string;
	timestamp: number;
}

export interface ApiError {
	code: number;
	message: string;
	detail?: string;
}

// ============================================================
// Auth Types
// ============================================================
export interface LoginRequest {
	phone: string;
	password: string;
}

export interface LoginResponse {
	user_id: number;
	username: string | null;
	token: string;
}

export interface RegisterRequest {
	phone: string;
	code: string;
	password: string;
}

export interface RegisterResponse {
	user_id: number;
	username: string | null;
	token: string;
}

export interface SendCodeRequest {
	phone: string;
	type: "register" | "login" | "reset_password";
}

export interface SendCodeResponse {
	expires_in: number;
}

// ============================================================
// User Types
// ============================================================
export interface User {
	id: number;
	phone: string;
	username: string;
	email: string;
	is_admin: boolean;
	is_active: boolean;
	created_at: string;
}

export interface UserListRequest {
	page?: number;
	page_size?: number;
	search?: string;
}

export interface UserListResponse {
	total: number;
	page: number;
	page_size: number;
	list: User[];
}

export interface CreateUserRequest {
	phone: string;
	username: string;
	email: string;
}

export interface UpdateUserRequest {
	username?: string;
	email?: string;
}

export interface UpdateUserStatusRequest {
	is_active: boolean;
}

// ============================================================
// Error Codes
// ============================================================
export const ErrorCodes = {
	// 1xxx - Invalid Parameter
	INVALID_PARAMETER: 1001,
	INVALID_CODE: 1003,
	CODE_EXPIRED: 1004,

	// 2xxx - User Related
	USER_NOT_FOUND: 2001,
	INVALID_PASSWORD: 1002,
	USER_ALREADY_EXISTS: 2002,
	USER_DISABLED: 2003,
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorMessages: Record<ErrorCode, string> = {
	[ErrorCodes.INVALID_PARAMETER]: "参数错误",
	[ErrorCodes.INVALID_CODE]: "验证码错误",
	[ErrorCodes.CODE_EXPIRED]: "验证码已过期，请重新获取",
	[ErrorCodes.USER_NOT_FOUND]: "用户不存在",
	[ErrorCodes.INVALID_PASSWORD]: "密码错误",
	[ErrorCodes.USER_ALREADY_EXISTS]: "该手机号已注册",
	[ErrorCodes.USER_DISABLED]: "账户已被禁用，请联系管理员",
} as const;
