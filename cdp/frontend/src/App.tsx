import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { MainLayout } from '@/components/layout/MainLayout';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { useAuthStore } from '@/stores/authStore';

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
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
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
