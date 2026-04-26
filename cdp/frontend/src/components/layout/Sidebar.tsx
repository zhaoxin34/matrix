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
import Tooltip from "@mui/material/Tooltip";
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
    label: "系统管理",
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
          borderRight: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            background: "linear-gradient(135deg, #E65100 0%, #FF9800 100%)",
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
          sx={{ fontWeight: 700, fontSize: "1.125rem", color: "text.primary" }}
        >
          CDP
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {filteredGroups.map((group) => (
          <Box key={group.key} sx={{ mb: 1 }}>
            <Tooltip
              title={openGroups[group.key] ? "" : group.label}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => handleGroupClick(group.key)}
                sx={{
                  px: 2.5,
                  py: 1,
                  mx: 1.5,
                  borderRadius: 1.5,
                  "&:hover": { backgroundColor: "rgba(28, 43, 65, 0.04)" },
                }}
              >
                <ListItemText
                  primary={group.label}
                  slotProps={{
                    primary: {
                      variant: "caption",
                      sx: {
                        color: "text.secondary",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        fontSize: "0.6875rem",
                      },
                    },
                  }}
                />
                {openGroups[group.key] ? (
                  <ExpandLess sx={{ fontSize: 16, color: "text.secondary" }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 16, color: "text.secondary" }} />
                )}
              </ListItemButton>
            </Tooltip>
            <Collapse in={openGroups[group.key]} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ px: 1.5 }}>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item.key}
                    component={Link}
                    href={item.href}
                    selected={isActive(item.href)}
                    sx={{
                      pl: 2.5,
                      pr: 2,
                      py: 1.25,
                      borderRadius: 1.5,
                      mb: 0.5,
                      "&.Mui-selected": {
                        backgroundColor: "rgba(60, 130, 247, 0.08)",
                        borderLeft: "3px solid #3C82F7",
                        "&:hover": {
                          backgroundColor: "rgba(60, 130, 247, 0.12)",
                        },
                      },
                      "&:hover": { backgroundColor: "rgba(28, 43, 65, 0.04)" },
                    }}
                    data-testid={`nav-${item.key.replace(/\//g, "-")}`}
                  >
                    {item.icon && (
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: isActive(item.href)
                            ? "primary.light"
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
                              ? "text.primary"
                              : "text.secondary",
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
