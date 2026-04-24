import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/stores/authStore";

const { Content } = Layout;

export function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isAuthenticated && <Sidebar />}
      <Layout style={{ marginLeft: isAuthenticated ? 256 : 0 }}>
        <Content
          style={{
            padding: 24,
            minHeight: "100vh",
            background: "#f5f5f5",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
