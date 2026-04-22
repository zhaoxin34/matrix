import { Link, useNavigate } from "react-router-dom";
import { Button, Dropdown, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDisplayName = () => {
    if (!user) return "用户";
    return (
      user.username ||
      user.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") ||
      "用户"
    );
  };

  const userMenuItems = [
    { key: "profile", label: <Link to="/profile">我的账户</Link> },
    { type: "divider" as const },
    {
      key: "logout",
      label: "退出登录",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <header
      style={{
        height: 64,
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            to="/"
            style={{ fontSize: 20, fontWeight: "bold", color: "#1890ff" }}
            data-testid="link-header-logo"
          >
            CDP平台
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <span
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                data-testid="header-user-dropdown"
              >
                <Avatar size="small" icon={<UserOutlined />} />
                {getDisplayName()}
              </span>
            </Dropdown>
          ) : (
            <>
              <Link to="/login" data-testid="link-header-login">
                <Button icon={<UserOutlined />} data-testid="btn-header-login">
                  登录
                </Button>
              </Link>
              <Link to="/register" data-testid="link-header-register">
                <Button type="primary" data-testid="btn-header-register">
                  注册
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
