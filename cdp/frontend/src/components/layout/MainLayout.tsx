"use client";

import { ReactNode, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Sidebar from "./Sidebar";
import {
  Search as SearchIcon,
  NotificationsNoneOutlined,
  SettingsOutlined,
  KeyboardArrowDownOutlined,
  PersonOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";

const SIDEBAR_WIDTH = 260;

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

      {/* Right: Header + Content (vertical layout) */}
      <Box
        sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}
      >
        {/* Top Header Bar - Light Mode */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            height: 64,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Toolbar sx={{ height: 64, px: 3 }}>
            <Box sx={{ flexGrow: 1 }} />

            {/* Right Actions - Icons only, dark color for light mode */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {/* Workspace Selector - Purple Button Style */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  ml: 1,
                  borderRadius: 1.5,
                  backgroundColor: "rgba(156, 39, 176, 0.9)",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "rgba(156, 39, 176, 1)",
                  },
                }}
              >
                <Typography
                  sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#fff" }}
                >
                  {currentProject?.name || "CDP"}
                </Typography>
                <KeyboardArrowDownOutlined
                  sx={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}
                />
              </Box>
              {/* Search Icon Button */}
              <Tooltip title="搜索">
                <IconButton
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>

              {/* Notifications Icon Button with Badge */}
              <Tooltip title="通知">
                <IconButton
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <Badge badgeContent={3} color="error" variant="dot">
                    <NotificationsNoneOutlined sx={{ fontSize: 22 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Settings Icon Button */}
              <Tooltip title="设置">
                <IconButton
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <SettingsOutlined sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>

              {/* User Avatar with Dropdown */}
              <Box
                onClick={handleUserMenuOpen}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  borderRadius: 2,
                  py: 0.5,
                  px: 1,
                  ml: 1,
                  "&:hover": { backgroundColor: "action.hover" },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "#E65100",
                    fontSize: 14,
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
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
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
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box
          component="main"
          sx={{
            flex: 1,
            bgcolor: "#fff",
            overflow: "auto",
          }}
        >
          <Container maxWidth={false} sx={{ p: "0 !important" }}>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
