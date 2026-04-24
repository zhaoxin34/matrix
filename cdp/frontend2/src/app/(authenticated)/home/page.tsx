"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Hero 区域 - 仅未登录时显示 */}
        {!isAuthenticated && (
          <Box
            sx={{
              textAlign: "center",
              mb: 6,
              p: 6,
              borderRadius: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
            }}
          >
            <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
              欢迎来到CDP平台
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              客户数据平台，助您更好地管理和分析客户数据
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: "#fff",
                    color: "#667eea",
                    fontWeight: 600,
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  data-testid="btn-home-login"
                >
                  登录
                </Button>
              </Link>
              <Link href="/register" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: "#fff",
                    borderColor: "#fff",
                    fontWeight: 600,
                    "&:hover": { borderColor: "#f5f5f5", backgroundColor: "rgba(255,255,255,0.1)" },
                  }}
                  data-testid="btn-home-register"
                >
                  注册
                </Button>
              </Link>
            </Box>
          </Box>
        )}

        {/* 欢迎信息 */}
        <Typography variant="h4" sx={{ mb: 3 }}>
          欢迎回来, {user?.username || "用户"}
        </Typography>

        {/* 功能卡片区域 */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                borderRadius: 3,
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
              }}
              data-testid="card-customer-mgmt"
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 32 }}>👥</Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  客户管理
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  统一管理客户信息，构建完整的客户画像
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                borderRadius: 3,
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
              }}
              data-testid="card-data-integration"
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 32 }}>📊</Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  数据整合
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  整合多渠道数据，打破数据孤岛
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                borderRadius: 3,
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
              }}
              data-testid="card-security"
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 32 }}>🔒</Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  安全可靠
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  多重保障，确保数据安全和隐私合规
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
