"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <Box sx={{ py: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ mb: 1, fontWeight: 700, color: "text.primary" }}
        >
          欢迎回来, {user?.username || "用户"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          今天是个好日子，让我们开始工作吧
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {[
            {
              label: "总客户数",
              value: "1,234",
              trend: "+12%",
              icon: PeopleIcon,
              color: "#3C82F7",
            },
            {
              label: "本月新增",
              value: "156",
              trend: "+8%",
              icon: TrendingUpIcon,
              color: "#10B981",
            },
            {
              label: "活跃订单",
              value: "89",
              trend: "+23%",
              icon: ShoppingCartIcon,
              color: "#F59E0B",
            },
            {
              label: "本月收入",
              value: "¥45,678",
              trend: "+18%",
              icon: AttachMoneyIcon,
              color: "#8B5CF6",
            },
          ].map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: stat.color,
                    boxShadow: `0 4px 20px rgba(0, 0, 0, 0.08)`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: `${stat.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <stat.icon sx={{ color: stat.color, fontSize: 24 }} />
                    </Box>
                    <Chip
                      label={stat.trend}
                      size="small"
                      sx={{
                        backgroundColor: `${stat.color}15`,
                        color: stat.color,
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </Box>
                  <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
        >
          快捷操作
        </Typography>
        <Grid container spacing={2}>
          {[
            { label: "客户管理", href: "/customer", emoji: "👥" },
            { label: "项目管理", href: "/projects", emoji: "📁" },
            { label: "组织架构", href: "/org-structure", emoji: "🏢" },
            { label: "技能库", href: "/skill-library", emoji: "📚" },
          ].map((action, index) => (
            <Grid key={index} size={{ xs: 6, md: 3 }}>
              <Link href={action.href} style={{ textDecoration: "none" }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid transparent",
                    "&:hover": {
                      borderColor: "primary.light",
                      transform: "translateY(-2px)",
                      boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.08)",
                    },
                  }}
                  data-testid={`card-action-${action.label}`}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 32, mb: 1.5 }}>
                      {action.emoji}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "text.primary" }}
                    >
                      {action.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recent Activity & Team */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                最近活动
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  {
                    user: "张三",
                    action: "创建了新项目",
                    time: "5分钟前",
                    avatar: "张",
                  },
                  {
                    user: "李四",
                    action: "更新了客户信息",
                    time: "15分钟前",
                    avatar: "李",
                  },
                  {
                    user: "王五",
                    action: "添加了新成员",
                    time: "1小时前",
                    avatar: "王",
                  },
                ].map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "background.default",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "primary.main",
                        fontSize: 14,
                      }}
                    >
                      {activity.avatar}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.user}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {" "}
                          {activity.action}
                        </Typography>
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                项目进度
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { name: "CDP 2.0", progress: 75 },
                  { name: "数据迁移", progress: 45 },
                  { name: "UI 优化", progress: 90 },
                ].map((project, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "divider",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          backgroundColor:
                            project.progress > 80
                              ? "success.main"
                              : project.progress > 50
                              ? "primary.light"
                              : "warning.main",
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
