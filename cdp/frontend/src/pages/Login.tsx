import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

const { Title, Paragraph } = Typography;

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.phone, values.password);
      message.success("登录成功");
      navigate("/");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        "登录失败，请检查手机号和密码";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "48px 24px" }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2}>登录</Title>
          <Paragraph style={{ color: "#666" }}>欢迎回来</Paragraph>
        </div>
        <Form name="login" layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: "请输入手机号" },
              { pattern: /^1[3-9]\d{9}$/, message: "请输入有效的手机号" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="手机号"
              size="large"
              data-testid="inp-login-phone"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
              autoComplete="current-password"
              data-testid="inp-login-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || isLoading}
              size="large"
              block
              data-testid="btn-login-submit"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          还没有账号？
          <Link to="/register" data-testid="link-login-register">
            立即注册
          </Link>
        </div>
      </Card>
    </div>
  );
}
