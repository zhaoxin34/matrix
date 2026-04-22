import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { useAuthStore } from "@/stores/authStore";
import { message } from "antd";
import { ApiResponse, ErrorCode } from "./types";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 响应拦截器 - 处理统一响应格式
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const res = response.data;

    // 如果业务 code 不为 0，视为错误
    if (res.code !== ErrorCode.OK) {
      // 对于登录接口的 UNAUTHORIZED 错误（用户名或密码错误），
      // 不显示拦截器的消息，让 Login 页面自己处理
      const isLoginRequest = response.config.url?.includes("/auth/login");
      const isLoginUnauthorized = res.code === ErrorCode.UNAUTHORIZED && isLoginRequest;

      if (res.code === ErrorCode.UNAUTHORIZED && !isLoginRequest) {
        // token 过期（非登录接口），重定向到登录页
        useAuthStore.getState().logout();
        message.error("登录已过期，请重新登录");
        window.location.href = "/login";
      } else if (!isLoginUnauthorized) {
        // 其他错误，显示消息
        message.error(res.message || "请求失败");
      }
      return Promise.reject(new Error(res.message || "请求失败"));
    }

    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response) {
      const status = error.response.status;
      const resData = error.response.data;

      // 如果后端返回了标准格式的错误
      if (resData && resData.code !== undefined) {
        if (resData.code === ErrorCode.UNAUTHORIZED) {
          useAuthStore.getState().logout();
          message.error("登录已过期，请重新登录");
          window.location.href = "/login";
        } else {
          message.error(resData.message || "请求失败");
        }
      } else if (status === 401) {
        // HTTP 401
        useAuthStore.getState().logout();
        message.error("登录已过期，请重新登录");
        window.location.href = "/login";
      } else if (status === 400) {
        message.error("请求参数错误");
      } else if (status === 404) {
        message.error("资源不存在");
      } else if (status >= 500) {
        message.error("服务器错误");
      }
    } else if (error.request) {
      message.error("网络错误，请检查网络连接");
    } else {
      message.error(error.message || "请求失败");
    }
    return Promise.reject(error);
  },
);

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

export default apiClient;
