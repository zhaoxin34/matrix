import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { MainLayout } from "@/components/layout/MainLayout";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { Customer } from "@/pages/Customer";
import { UserProfile } from "@/pages/UserProfile";
import { OrgStructurePage } from "@/pages/OrgStructure";
import { UserManagementPage } from "@/pages/UserManagement";
import { SkillLibraryPage } from "@/pages/SkillLibrary";
import { ProjectListPage } from "@/pages/ProjectManagement/ProjectListPage";
import { ProjectDetailPage } from "@/pages/ProjectManagement/ProjectDetailPage";
import { useAuthStore } from "@/stores/authStore";

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function TokenValidator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchCurrentUser().catch(() => {
        logout();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <TokenValidator />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route
              path="login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />
            <Route
              path="forgot-password"
              element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              }
            />
            <Route
              path="reset-password"
              element={
                <GuestRoute>
                  <ResetPassword />
                </GuestRoute>
              }
            />
            <Route
              path="customer"
              element={
                <AuthRoute>
                  <Customer />
                </AuthRoute>
              }
            />
            <Route
              path="profile"
              element={
                <AuthRoute>
                  <UserProfile />
                </AuthRoute>
              }
            />
            <Route
              path="org-structure"
              element={
                <AuthRoute>
                  <OrgStructurePage />
                </AuthRoute>
              }
            />
            <Route
              path="skill-library"
              element={
                <AuthRoute>
                  <SkillLibraryPage />
                </AuthRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <UserManagementPage />
                </AdminRoute>
              }
            />
            <Route
              path="projects"
              element={
                <AuthRoute>
                  <ProjectListPage />
                </AuthRoute>
              }
            />
            <Route
              path="projects/:id"
              element={
                <AuthRoute>
                  <ProjectDetailPage />
                </AuthRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
