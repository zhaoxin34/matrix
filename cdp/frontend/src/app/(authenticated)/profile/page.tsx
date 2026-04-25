"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      // TODO: 调用后端API更新个人信息
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("个人信息更新成功");
    } catch {
      alert("更新失败");
    } finally {
      setLoading(false);
    }
  };

  const handleChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: event.target.value });
    };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mb: 3 }}>
        个人中心
      </Typography>

      <Card sx={{ mb: 3, p: 3, textAlign: "center" }}>
        <Avatar sx={{ width: 80, height: 80, mx: "auto", mb: 2, fontSize: 40 }}>
          {user?.username?.charAt(0) || "用户"}
        </Avatar>
        <Typography variant="h6">{user?.username || "用户"}</Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email || user?.phone}
        </Typography>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          编辑个人信息
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="用户名"
            margin="normal"
            value={formData.username}
            onChange={handleChange("username")}
            required
            data-testid="inp-profile-username"
          />
          <TextField
            fullWidth
            label="邮箱"
            type="email"
            margin="normal"
            value={formData.email}
            onChange={handleChange("email")}
            disabled
            data-testid="inp-profile-email"
          />
          <TextField
            fullWidth
            label="手机号"
            type="tel"
            margin="normal"
            value={formData.phone}
            onChange={handleChange("phone")}
            data-testid="inp-profile-phone"
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
            data-testid="btn-profile-submit"
          >
            {loading ? "保存中..." : "保存修改"}
          </Button>
        </Box>
      </Card>
    </Container>
  );
}
