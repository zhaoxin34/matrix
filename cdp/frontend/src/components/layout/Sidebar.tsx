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
  Folder,
  Home,
  People,
  School,
  AccountTree,
} from "@mui/icons-material";
import { useAuthStore } from "@/stores/authStore";

const DRAWER_WIDTH = 260;

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
    label: "OVERVIEW",
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
    label: "PROJECT",
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
    label: "SYSTEM",
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
          borderRight: "1px solid #E5E7EB",
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            background: "linear-gradient(135deg, #3C82F7 0%, #60A5FA 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          CDP
        </Box>
        <Typography
          sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#1A1A1A" }}
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
                  color: "#1A1A1A",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {group.label}
              </Typography>
              {openGroups[group.key] ? (
                <ExpandLess sx={{ fontSize: 16, color: "#1A1A1A", ml: "auto" }} />
              ) : (
                <ExpandMore sx={{ fontSize: 16, color: "#1A1A1A", ml: "auto" }} />
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
                      py: 1,
                      borderRadius: 1,
                      mb: 0.25,
                      "&.Mui-selected": {
                        backgroundColor: "rgba(60, 130, 247, 0.1)",
                        borderLeft: "3px solid #3C82F7",
                        "&:hover": {
                          backgroundColor: "rgba(60, 130, 247, 0.15)",
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
                          minWidth: 36,
                          color: isActive(item.href) ? "#3C82F7" : "#637381",
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
                            fontWeight: isActive(item.href) ? 600 : 500,
                            color: isActive(item.href) ? "#1A1A1A" : "#637381",
                            fontSize: "0.875rem",
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
