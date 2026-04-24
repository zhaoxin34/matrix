"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    code: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone.trim()) {
      newErrors.phone = "请输入手机号";
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "请输入有效的手机号";
    }

    if (!formData.code.trim()) {
      newErrors.code = "请输入验证码";
    }

    if (!formData.password) {
      newErrors.password = "请输入新密码";
    } else if (formData.password.length < 6) {
      newErrors.password = "密码至少6位";
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
      // TODO: 调用后端API重置密码
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("密码重置成功");
      router.push("/login");
    } catch {
      alert("密码重置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
            重置密码
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            输入您收到的验证码和新密码
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
            value={formData.phone}
            onChange={handleChange("phone")}
            error={!!errors.phone}
            helperText={errors.phone}
            data-testid="inp-reset-password-phone"
            autoComplete="tel"
          />
          <TextField
            fullWidth
            name="code"
            label="验证码"
            type="text"
            size="medium"
            margin="normal"
            required
            value={formData.code}
            onChange={handleChange("code")}
            error={!!errors.code}
            helperText={errors.code}
            data-testid="inp-reset-password-code"
          />
          <TextField
            fullWidth
            name="password"
            label="新密码"
            type="password"
            size="medium"
            margin="normal"
            required
            value={formData.password}
            onChange={handleChange("password")}
            error={!!errors.password}
            helperText={errors.password}
            data-testid="inp-reset-password-password"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
            data-testid="btn-reset-password-submit"
          >
            {loading ? "重置中..." : "重置密码"}
          </Button>
        </Box>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Link
            href="/login"
            data-testid="link-reset-password-login"
            style={{ color: "#1890ff", textDecoration: "none" }}
          >
            返回登录
          </Link>
        </Box>
      </Card>
    </Box>
  );
}
