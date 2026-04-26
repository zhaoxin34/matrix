"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#1F1F1F",
            mb: 0.5,
            letterSpacing: "-0.02em",
          }}
        >
          Good evening, {user?.username || "用户"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B6B6B" }}>
          Here&apos;s what&apos;s happening with your projects today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {[
            {
              label: "Total customers",
              value: "1,234",
              trend: "+12%",
              icon: PeopleIcon,
              color: "#3B82F6",
            },
            {
              label: "New this month",
              value: "156",
              trend: "+8%",
              icon: TrendingUpIcon,
              color: "#10B981",
            },
            {
              label: "Active orders",
              value: "89",
              trend: "+23%",
              icon: ShoppingCartIcon,
              color: "#F59E0B",
            },
            {
              label: "Revenue",
              value: "$45.6k",
              trend: "+18%",
              icon: AttachMoneyIcon,
              color: "#8B5CF6",
            },
          ].map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "#E5E5E5",
                  boxShadow: "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: stat.color,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <Box sx={{ p: 3 }}>
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
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        backgroundColor: `${stat.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <stat.icon sx={{ color: stat.color, fontSize: 18 }} />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: stat.color,
                        fontWeight: 500,
                        fontSize: "0.6875rem",
                      }}
                    >
                      {stat.trend}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "#1F1F1F",
                      mb: 0.5,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#6B6B6B", fontSize: "0.75rem" }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "#E5E5E5",
              boxShadow: "none",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1F1F1F",
                  mb: 3,
                }}
              >
                Recent Activity
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  {
                    user: "张三",
                    action: "created a new project",
                    time: "5 min ago",
                    avatar: "张",
                    color: "#3B82F6",
                  },
                  {
                    user: "李四",
                    action: "updated customer info",
                    time: "15 min ago",
                    avatar: "李",
                    color: "#10B981",
                  },
                  {
                    user: "王五",
                    action: "added new member",
                    time: "1 hour ago",
                    avatar: "王",
                    color: "#F59E0B",
                  },
                ].map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: activity.color,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {activity.avatar}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: "#1F1F1F",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {activity.user}
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: "#6B6B6B", fontWeight: 400 }}
                        >
                          {" "}
                          {activity.action}
                        </Typography>
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "#6B6B6B", fontSize: "0.6875rem" }}
                    >
                      {activity.time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Project Progress */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "#E5E5E5",
              boxShadow: "none",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1F1F1F",
                  mb: 3,
                }}
              >
                Project Progress
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { name: "CDP 2.0", progress: 75 },
                  { name: "Data Migration", progress: 45 },
                  { name: "UI Optimization", progress: 90 },
                ].map((project, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: "#1F1F1F",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {project.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6B6B6B", fontSize: "0.6875rem" }}
                      >
                        {project.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#E5E5E5",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 2,
                          backgroundColor:
                            project.progress > 80
                              ? "#10B981"
                              : project.progress > 50
                                ? "#3B82F6"
                                : "#F59E0B",
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
