import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title, Paragraph } = Typography;

export function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async () => {
    setLoading(true);
    try {
      // TODO: 调用后端API重置密码
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("密码重置成功");
      navigate("/login");
    } catch {
      message.error("密码重置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "48px 24px" }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2}>重置密码</Title>
          <Paragraph style={{ color: "#666" }}>
            输入您收到的验证码和新密码
          </Paragraph>
        </div>
        <Form name="reset-password" layout="vertical" onFinish={onFinish}>
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
              data-testid="inp-reset-password-phone"
            />
          </Form.Item>
          <Form.Item
            name="code"
            rules={[{ required: true, message: "请输入验证码" }]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="验证码"
              size="large"
              data-testid="inp-reset-password-code"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码至少6位" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码"
              size="large"
              data-testid="inp-reset-password-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              data-testid="btn-reset-password-submit"
            >
              重置密码
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/login">返回登录</Link>
        </div>
      </Card>
    </div>
  );
}