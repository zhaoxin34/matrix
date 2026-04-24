import { Link, useLocation } from "react-router-dom";
import { Layout, Collapse, Avatar, Dropdown, Select, Space, Badge } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";

const { Sider } = Layout;

export function Sidebar() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { currentProject, projects, setCurrentProject } = useProjectStore();

  const getDisplayName = () => {
    if (!user) return "用户";
    return user.username || user.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") || "用户";
  };

  const getEmail = () => {
    return user?.email || user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") || "";
  };

  const handleLogout = () => {
    try {
      logout();
    } catch {
      // logout failed
    }
  };

  const userMenuItems: MenuProps["items"] = [
    { key: "profile", label: <Link to="/profile">我的账户</Link>, icon: <SettingOutlined /> },
    { type: "divider" },
    { key: "logout", label: "退出登录", icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  // 项目切换处理
  const handleProjectChange = (projectId: number | null) => {
    if (projectId === null) {
      setCurrentProject(null);
      return;
    }
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  // 根据 Pencil 设计分为两组导航
  const collapseItems = [
    {
      key: "group-project",
      label: "项目管理",
      children: [
        {
          key: "/projects/members",
          label: <Link to="/projects/members">成员管理</Link>,
        },
        {
          key: "/projects/roles",
          label: <Link to="/projects/roles">角色管理</Link>,
        },
      ],
    },
    {
      key: "group-system",
      label: "系统管理",
      children: [
        {
          key: "/org-structure",
          label: <Link to="/org-structure" data-testid="link-sidebar-org-structure">组织架构</Link>,
        },
        {
          key: "/projects",
          label: <Link to="/projects">项目管理</Link>,
        },
        ...(user?.is_admin
          ? [
              {
                key: "/admin/users",
                label: <Link to="/admin/users">用户管理</Link>,
              },
            ]
          : []),
        {
          key: "/skill-library",
          label: <Link to="/skill-library">技能库</Link>,
        },
      ],
    },
  ];

  // 判断当前路径属于哪个 group
  const getActiveGroup = () => {
    const path = location.pathname;
    if (path.includes("/projects/members") || path.includes("/projects/roles")) {
      return "group-project";
    }
    return "group-system";
  };

  // 判断是否有多个项目可以切换
  const showProjectSwitcher = projects.length > 0;

  return (
    <Sider
      width={256}
      style={{
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Brand 区域 - 项目切换器 */}
      <div
        style={{
          height: 64,
          padding: "8px 12px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
        }}
      >
        {showProjectSwitcher ? (
          <Select
            value={currentProject?.id}
            onChange={handleProjectChange}
            style={{ width: "100%" }}
            placeholder="选择项目"
            suffixIcon={<DownOutlined />}
            options={projects.map((p) => ({
              value: p.id,
              label: (
                <Space>
                  <span>{p.name}</span>
                  {p.role === "admin" && (
                    <Badge count="管理员" style={{ fontSize: 10 }} />
                  )}
                </Space>
              ),
            }))}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#1890ff",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <span>CDP平台</span>
          </div>
        )}
      </div>

      {/* 可折叠导航 */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80, minHeight: 0 }}>
        <Collapse
          defaultActiveKey={[getActiveGroup()]}
          ghost
          expandIconPosition="end"
          items={collapseItems.map((group) => ({
            ...group,
            children: (
              <div style={{ paddingLeft: 8 }}>
                {group.children.map((item: { key: string; label: React.ReactNode }) => {
                  const isActive = location.pathname === item.key;
                  return (
                    <div
                      key={item.key}
                      style={{
                        padding: "10px 12px",
                        marginBottom: 4,
                        borderRadius: 8,
                        background: isActive ? "#e6f7ff" : "transparent",
                        color: isActive ? "#1890ff" : "#595959",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.2s ease",
                        borderLeft: isActive ? "3px solid #1890ff" : "3px solid transparent",
                      }}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            ),
          }))}
        />
      </div>

      {/* 用户信息 Footer */}
      {isAuthenticated && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#fafafa",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{ background: "#1890ff" }}
          />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#262626",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {getDisplayName()}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#8c8c8c",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {getEmail()}
            </div>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="topRight">
            <span
              style={{
                cursor: "pointer",
                color: "#8c8c8c",
                padding: "4px 8px",
                borderRadius: 4,
                transition: "all 0.2s ease",
              }}
              data-testid="sidebar-user-menu"
            >
              ⋮
            </span>
          </Dropdown>
        </div>
      )}
    </Sider>
  );
}