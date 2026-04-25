"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const snackbar = useSnackbar();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const validatePhone = (value: string) => {
    if (!value.trim()) {
      return "请输入手机号";
    }
    if (!/^1[3-9]\d{9}$/.test(value)) {
      return "请输入有效的手机号";
    }
    return "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用后端API发送验证码
      await new Promise((resolve) => setTimeout(resolve, 1000));
      snackbar.success("验证码已发送到您的手机");
      router.push("/reset-password");
    } catch {
      snackbar.error("发送验证码失败，请稍后重试");
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
            忘记密码
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            输入您的注册手机号，我们将发送验证码到您的手机
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
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError("");
            }}
            error={!!error}
            helperText={error}
            data-testid="inp-forgot-password-phone"
            autoComplete="tel"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
            data-testid="btn-forgot-password-submit"
          >
            {loading ? "发送中..." : "发送验证码"}
          </Button>
        </Box>

        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Link
            href="/login"
            data-testid="link-forgot-password-login"
            style={{ color: "#1890ff", textDecoration: "none" }}
          >
            返回登录
          </Link>
        </Box>
      </Card>
    </Box>
  );
}
