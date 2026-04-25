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

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "请输入用户名";
    }

    if (!formData.email.trim()) {
      newErrors.email = "请输入邮箱";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "请输入手机号";
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "请输入有效的手机号";
    }

    if (!formData.password) {
      newErrors.password = "请输入密码";
    } else if (formData.password.length < 8) {
      newErrors.password = "密码至少8位";
    } else if (
      !/[A-Za-z]/.test(formData.password) ||
      !/\d/.test(formData.password)
    ) {
      newErrors.password = "密码需包含字母和数字";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次密码输入不一致";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      alert("注册成功");
      router.push("/");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const errorMsg =
        err.response?.data?.detail || err.message || "注册失败，请稍后重试";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: event.target.value });
      if (errors[field]) {
        setErrors({ ...errors, [field]: "" });
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
            注册
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            创建新账号
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            name="username"
            label="用户名"
            size="medium"
            margin="normal"
            required
            value={formData.username}
            onChange={handleChange("username")}
            error={!!errors.username}
            helperText={errors.username}
            data-testid="inp-reg-username"
            autoComplete="username"
          />
          <TextField
            fullWidth
            name="email"
            label="邮箱"
            type="email"
            size="medium"
            margin="normal"
            required
            value={formData.email}
            onChange={handleChange("email")}
            error={!!errors.email}
            helperText={errors.email}
            data-testid="inp-reg-email"
            autoComplete="email"
          />
          <TextField
            fullWidth
            name="phone"
            label="手机号"
            type="tel"
            size="medium"
            margin="normal"
            required
            value={formData.phone}
            onChange={handleChange("phone")}
            error={!!errors.phone}
            helperText={errors.phone}
            data-testid="inp-reg-phone"
            autoComplete="tel"
          />
          <TextField
            fullWidth
            name="password"
            label="密码（至少8位，需包含字母和数字）"
            type="password"
            size="medium"
            margin="normal"
            required
            value={formData.password}
            onChange={handleChange("password")}
            error={!!errors.password}
            helperText={errors.password}
            data-testid="inp-reg-password"
            autoComplete="new-password"
          />
          <TextField
            fullWidth
            name="confirmPassword"
            label="确认密码"
            type="password"
            size="medium"
            margin="normal"
            required
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            data-testid="inp-reg-confirm-password"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || isLoading}
            sx={{ mt: 3, mb: 2 }}
            data-testid="btn-reg-submit"
          >
            {loading || isLoading ? "注册中..." : "注册"}
          </Button>
        </Box>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          已有账号？
          <Link
            href="/login"
            data-testid="link-reg-login"
            style={{ color: "#1890ff", textDecoration: "none", marginLeft: 4 }}
          >
            立即登录
          </Link>
        </Box>
      </Card>
    </Box>
  );
}
