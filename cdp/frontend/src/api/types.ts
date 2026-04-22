/**
 * 统一 API 响应格式
 * 遵循项目 API 规范
 */
export interface ApiResponse<T> {
  code: number; // 业务状态码（0 = 成功）
  message: string; // 给人类/AI 的错误说明
  data: T; // 返回数据
  traceId: string; // 请求链路ID
  timestamp: number; // 服务端时间戳（毫秒）
}

export interface ApiError {
  code: number;
  message: string;
  data: null;
  traceId: string;
  timestamp: number;
}

// 错误码
export const ErrorCode = {
  OK: 0,
  INVALID_PARAMETER: 1001,
  UNAUTHORIZED: 1002,
  FORBIDDEN: 1003,
  NOT_FOUND: 1004,
  INTERNAL_ERROR: 1005,
  USER_NOT_FOUND: 2001,
  USER_ALREADY_EXISTS: 2002,
  USER_DISABLED: 2003,
  USER_PASSWORD_MISMATCH: 2004,
  SMS_CODE_EXPIRED: 3001,
  SMS_CODE_INVALID: 3002,
  SMS_CODE_MISMATCH: 3003,
  SYSTEM_ERROR: 9001,
  DATABASE_ERROR: 9002,
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
