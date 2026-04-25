"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    setLoading(true);
    try {
      await login(phone, password);
      router.push("/home");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "登录失败，请检查手机号和密码";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 12,
        px: 3,
      }}
    >
      <Card sx={{ p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 1, textAlign: "center" }}>
            登录
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            欢迎回来
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            name="phone"
            label="手机号"
            type="tel"
            size="medium"
            margin="normal"
            required
            data-testid="inp-login-phone"
            autoComplete="tel"
          />
          <TextField
            fullWidth
            name="password"
            label="密码"
            type="password"
            size="medium"
            margin="normal"
            required
            data-testid="inp-login-password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || isLoading}
            sx={{ mt: 3, mb: 2 }}
            data-testid="btn-login-submit"
          >
            {loading || isLoading ? "登录中..." : "登录"}
          </Button>
        </Box>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Link
            href="/forgot-password"
            data-testid="link-login-forgot-password"
            style={{ color: "#1890ff", textDecoration: "none" }}
          >
            忘记密码？
          </Link>
          <span style={{ margin: "0 8px", color: "#999" }}>|</span>
          还没有账号？
          <Link
            href="/register"
            data-testid="link-login-register"
            style={{ color: "#1890ff", textDecoration: "none", marginLeft: 4 }}
          >
            立即注册
          </Link>
        </Box>
      </Card>
    </Box>
  );
}
