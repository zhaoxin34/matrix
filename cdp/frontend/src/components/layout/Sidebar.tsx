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
import ListItemIcon from "@mui/material/ListItemIcon";
import {
  ExpandLess,
  ExpandMore,
  Home,
  People,
  Folder,
  AccountTree,
  Settings,
  School,
} from "@mui/icons-material";
import { useAuthStore } from "@/stores/authStore";

const DRAWER_WIDTH = 240;

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
    key: "group-main",
    label: "主菜单",
    items: [
      {
        key: "/home",
        label: "工作台",
        icon: <Home sx={{ fontSize: 20 }} />,
        href: "/home",
      },
    ],
  },
  {
    key: "group-project",
    label: "项目管理",
    items: [
      {
        key: "/projects/members",
        label: "成员管理",
        icon: <People sx={{ fontSize: 20 }} />,
        href: "/projects/members",
      },
      {
        key: "/projects/roles",
        label: "角色管理",
        icon: <AccountTree sx={{ fontSize: 20 }} />,
        href: "/projects/roles",
      },
    ],
  },
  {
    key: "group-system",
    label: "系统",
    items: [
      {
        key: "/org-structure",
        label: "组织架构",
        icon: <AccountTree sx={{ fontSize: 20 }} />,
        href: "/org-structure",
      },
      {
        key: "/projects",
        label: "项目管理",
        icon: <Folder sx={{ fontSize: 20 }} />,
        href: "/projects",
      },
      {
        key: "/admin/users",
        label: "用户管理",
        icon: <People sx={{ fontSize: 20 }} />,
        href: "/admin/users",
        adminOnly: true,
      },
      {
        key: "/skill-library",
        label: "技能库",
        icon: <School sx={{ fontSize: 20 }} />,
        href: "/skill-library",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "group-main": true,
    "group-project": true,
    "group-system": true,
  });

  const handleGroupClick = (groupKey: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const isActive = (href: string) => pathname === href;

  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if ("adminOnly" in item && item.adminOnly && !user?.is_admin)
        return false;
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
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E5E5E5",
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: "#7D3987",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings sx={{ fontSize: 18, color: "#fff" }} />
        </Box>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "#1F1F1F",
            letterSpacing: "-0.01em",
          }}
        >
          客户数据平台
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {filteredGroups.map((group) => (
          <Box key={group.key} sx={{ mb: 0.5 }}>
            {/* Group Header */}
            <ListItemButton
              onClick={() => handleGroupClick(group.key)}
              sx={{
                px: 2,
                py: 0.75,
                mx: 1,
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <Typography
                component="span"
                sx={{
                  color: "#6B6B6B",
                  fontWeight: 500,
                  fontSize: "0.6875rem",
                  letterSpacing: "0.02em",
                }}
              >
                {group.label}
              </Typography>
              {openGroups[group.key] ? (
                <ExpandLess
                  sx={{ fontSize: 14, color: "#6B6B6B", ml: "auto" }}
                />
              ) : (
                <ExpandMore
                  sx={{ fontSize: 14, color: "#6B6B6B", ml: "auto" }}
                />
              )}
            </ListItemButton>

            {/* Collapsible Menu Items */}
            <Collapse in={openGroups[group.key]} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ px: 1 }}>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item.key}
                    component={Link}
                    href={item.href}
                    selected={isActive(item.href)}
                    sx={{
                      pl: 2,
                      pr: 1.5,
                      py: 0.875,
                      borderRadius: 1,
                      mb: 0.25,
                      "&.Mui-selected": {
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        borderLeft: "2px solid #3B82F6",
                        "&:hover": {
                          backgroundColor: "rgba(59, 130, 246, 0.15)",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                    data-testid={`nav-${item.key.replace(/\//g, "-")}`}
                  >
                    {item.icon && (
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: isActive(item.href) ? "#3B82F6" : "#6B6B6B",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontWeight: isActive(item.href) ? 500 : 400,
                            color: isActive(item.href) ? "#1F1F1F" : "#6B6B6B",
                            fontSize: "0.8125rem",
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
