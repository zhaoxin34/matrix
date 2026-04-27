"use client";

import { ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Sidebar from "./Sidebar";
import {
  PersonOutlined,
  LogoutOutlined,
  SettingsOutlined,
  Search as SearchIcon,
  NotificationsNoneOutlined,
  KeyboardArrowDownOutlined,
} from "@mui/icons-material";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";

const SIDEBAR_WIDTH = 240;

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuthStore();
  const { currentProject } = useProjectStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const getDisplayName = () => {
    if (!user) return "用户";
    return (
      user.username ||
      user.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") ||
      "用户"
    );
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left: Sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <Sidebar />
      </Box>

      {/* Right: Content Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
          bgcolor: "#F5F5F5",
        }}
      >
        {/* Top Header */}
        <Box
          component="header"
          sx={{
            height: 56,
            px: 3,
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "#FFFFFF",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ flexGrow: 1 }} />

          {/* Workspace Selector */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 1.5,
              backgroundColor: "#76527B",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#44134A",
              },
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.8125rem",
                color: "#fff",
              }}
            >
              {currentProject?.name || "CDP"}
            </Typography>
            <KeyboardArrowDownOutlined
              sx={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}
            />
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {/* Search Icon Button */}
            <Tooltip title="Search">
              <IconButton
                size="small"
                sx={{
                  color: "#6B6B6B",
                  "&:hover": {
                    color: "#1F1F1F",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* Notifications Icon Button with Badge */}
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                sx={{
                  color: "#6B6B6B",
                  "&:hover": {
                    color: "#1F1F1F",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <Badge badgeContent={3} color="error" variant="dot">
                  <NotificationsNoneOutlined sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Settings Icon Button */}
            <Tooltip title="Settings">
              <IconButton
                size="small"
                component="a"
                href="/settings"
                sx={{
                  color: "#6B6B6B",
                  "&:hover": {
                    color: "#1F1F1F",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <SettingsOutlined sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* User Avatar with Dropdown */}
            <Box
              onClick={handleUserMenuOpen}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                borderRadius: 1,
                ml: 0.5,
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "#3B82F6",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {getDisplayName().charAt(0).toUpperCase()}
              </Avatar>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleUserMenuClose}
              slotProps={{
                paper: { sx: { mt: 1, minWidth: 200, borderRadius: 2 } },
              }}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {getDisplayName()}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {user?.email || user?.phone}
                </Typography>
              </Box>
              <Divider />
              <MenuItem
                component="a"
                href="/profile"
                onClick={handleUserMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <PersonOutlined fontSize="small" />
                </ListItemIcon>
                个人资料
              </MenuItem>
              <MenuItem
                component="a"
                href="/settings"
                onClick={handleUserMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <SettingsOutlined fontSize="small" />
                </ListItemIcon>
                设置
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={handleLogout}
                sx={{ py: 1.5, color: "error.main" }}
              >
                <ListItemIcon>
                  <LogoutOutlined fontSize="small" color="error" />
                </ListItemIcon>
                退出登录
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Content Area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
          }}
        >
          <Box sx={{ p: 3 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
