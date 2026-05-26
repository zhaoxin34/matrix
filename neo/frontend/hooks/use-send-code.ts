/**
 * useSendCode Hook
 * Manages SMS verification code sending logic
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { sendCode, getErrorMessage } from "@/lib/api/auth";

interface UseSendCodeOptions {
  phone: string;
  type: "register" | "login" | "reset_password";
  onSuccess?: (expiresIn: number) => void;
  onError?: (message: string) => void;
}

interface UseSendCodeReturn {
  isLoading: boolean;
  countdown: number;
  isCountingDown: boolean;
  error: string | null;
  send: () => Promise<void>;
  reset: () => void;
}

const COUNTDOWN_SECONDS = 60;

export function useSendCode({
  phone,
  type,
  onSuccess,
  onError,
}: UseSendCodeOptions): UseSendCodeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    setCountdown(seconds);
    setIsCountingDown(true);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setIsCountingDown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const send = useCallback(async () => {
    if (!phone || phone.length !== 11) {
      setError("请输入正确的11位手机号");
      onError?.("请输入正确的11位手机号");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendCode({ phone, type });
      if (response.code === 0) {
        const expiresIn = response.data.expires_in || COUNTDOWN_SECONDS;
        startCountdown(expiresIn);
        onSuccess?.(expiresIn);
      } else {
        const message = getErrorMessage(response.code);
        setError(message);
        onError?.(message);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "发送验证码失败，请稍后重试";
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [phone, type, onSuccess, onError, startCountdown]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCountdown(0);
    setIsCountingDown(false);
    setError(null);
  }, []);

  return {
    isLoading,
    countdown,
    isCountingDown,
    error,
    send,
    reset,
  };
}
