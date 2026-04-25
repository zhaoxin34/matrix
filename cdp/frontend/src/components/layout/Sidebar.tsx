"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import FormControl from "@mui/material/FormControl";
import Badge from "@mui/material/Badge";
import ListItemIcon from "@mui/material/ListItemIcon";
import Tooltip from "@mui/material/Tooltip";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";

const DRAWER_WIDTH = 256;

interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  adminOnly?: boolean;
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    key: "group-project",
    label: "项目管理",
    items: [
      {
        key: "/projects/members",
        label: "成员管理",
        icon: <PeopleIcon />,
        href: "/projects/members",
      },
      {
        key: "/projects/roles",
        label: "角色管理",
        icon: <AccountTreeIcon />,
        href: "/projects/roles",
      },
    ],
  },
  {
    key: "group-system",
    label: "系统管理",
    items: [
      {
        key: "/org-structure",
        label: "组织架构",
        icon: <AccountTreeIcon />,
        href: "/org-structure",
      },
      {
        key: "/projects",
        label: "项目管理",
        icon: <FolderIcon />,
        href: "/projects",
      },
      {
        key: "/admin/users",
        label: "用户管理",
        icon: <PeopleIcon />,
        href: "/admin/users",
        adminOnly: true,
      },
      {
        key: "/skill-library",
        label: "技能库",
        icon: <SchoolIcon />,
        href: "/skill-library",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { currentProject, projects, setCurrentProject } = useProjectStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "group-system": true,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleGroupClick = (groupKey: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const getDisplayName = () => {
    if (!user) return "用户";
    return (
      user.username ||
      user.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") ||
      "用户"
    );
  };

  const getEmail = () => {
    return (
      user?.email ||
      user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") ||
      ""
    );
  };

  const isActive = (href: string) => pathname === href;

  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if ("adminOnly" in item && item.adminOnly && !user?.is_admin) {
        return false;
      }
      return true;
    }),
  }));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          background: (theme) =>
            theme.palette.mode === "light"
              ? "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)"
              : "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        },
      }}
    >
      {/* Brand / Project Switcher */}
      <Box
        sx={{
          height: 64,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {projects.length > 0 ? (
          <FormControl fullWidth size="small">
            <Select
              value={currentProject?.id || ""}
              onChange={(e) => {
                const project = projects.find((p) => p.id === e.target.value);
                setCurrentProject(project || null);
              }}
              displayEmpty
              sx={{ fontSize: 14 }}
              renderValue={(value) => {
                if (!value)
                  return (
                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                      选择项目
                    </Typography>
                  );
                const selected = projects.find((p) => p.id === value);
                return (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FolderIcon sx={{ fontSize: 18, color: "primary.main" }} />
                    <span>{selected?.name}</span>
                  </Box>
                );
              }}
            >
              <MenuItem value="" disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FolderIcon sx={{ fontSize: 18 }} />
                  选择项目
                </Box>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{p.name}</span>
                    {p.role === "admin" && (
                      <Badge
                        badgeContent="管理员"
                        sx={{
                          "& .MuiBadge-badge": {
                            fontSize: 10,
                            height: 16,
                            minWidth: 16,
                          },
                        }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography
            variant="subtitle1"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            CDP平台
          </Typography>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {filteredGroups.map((group, groupIndex) => (
          <Box key={group.key}>
            {/* Group Header */}
            <Tooltip
              title={openGroups[group.key] ? "" : group.label}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => handleGroupClick(group.key)}
                sx={{
                  px: 2,
                  py: 0.75,
                  mb: 0.5,
                  borderRadius: 1,
                  mx: 1,
                  backgroundColor: openGroups[group.key]
                    ? "action.hover"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {group.key === "group-project" ? (
                    <FolderIcon
                      sx={{
                        fontSize: 18,
                        color: openGroups[group.key]
                          ? "primary.main"
                          : "text.secondary",
                      }}
                    />
                  ) : (
                    <AccountTreeIcon
                      sx={{
                        fontSize: 18,
                        color: openGroups[group.key]
                          ? "primary.main"
                          : "text.secondary",
                      }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={group.label}
                  slotProps={{
                    primary: {
                      variant: "subtitle2",
                      sx: {
                        color: openGroups[group.key]
                          ? "primary.main"
                          : "text.secondary",
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                      },
                    },
                  }}
                />
                {openGroups[group.key] ? (
                  <ExpandLess sx={{ fontSize: 18, color: "text.secondary" }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 18, color: "text.secondary" }} />
                )}
              </ListItemButton>
            </Tooltip>
            <Collapse in={openGroups[group.key]} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ mt: 0.5 }}>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item.key}
                    component={Link}
                    href={item.href}
                    selected={isActive(item.href)}
                    sx={{
                      pl: 3.5,
                      pr: 2,
                      py: 0.875,
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      "&.Mui-selected": {
                        backgroundColor: "action.selected",
                        borderLeft: "3px solid",
                        borderLeftColor: "primary.main",
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                    data-testid={`nav-${item.key.replace(/\//g, "-")}`}
                  >
                    {item.icon && (
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          fontSize: 18,
                          color: isActive(item.href)
                            ? "primary.main"
                            : "text.secondary",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          sx: {
                            fontWeight: isActive(item.href) ? 600 : 400,
                            color: isActive(item.href)
                              ? "primary.main"
                              : "text.primary",
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
            {/* Divider between groups */}
            {groupIndex < filteredGroups.length - 1 && (
              <Box
                sx={{
                  mx: 2,
                  my: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* User Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          onClick={handleMenuOpen}
          data-testid="btn-user-menu"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            flex: 1,
            borderRadius: 1,
            p: 0.5,
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              fontSize: 14,
            }}
          >
            {getDisplayName().charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "text.primary",
              }}
            >
              {getDisplayName()}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {getEmail()}
            </Typography>
          </Box>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <MenuItem
            component={Link}
            href="/profile"
            onClick={handleMenuClose}
            data-testid="menu-item-profile"
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            个人资料
          </MenuItem>
          <MenuItem onClick={handleLogout} data-testid="menu-item-logout">
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            退出登录
          </MenuItem>
        </Menu>
      </Box>
    </Drawer>
  );
}
