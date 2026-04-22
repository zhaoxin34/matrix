import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title, Paragraph } = Typography;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async () => {
    setLoading(true);
    try {
      // TODO: 调用后端API发送验证码
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("验证码已发送到您的手机");
      navigate("/reset-password");
    } catch {
      message.error("发送验证码失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "48px 24px" }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={2}>忘记密码</Title>
          <Paragraph style={{ color: "#666" }}>
            输入您的注册手机号，我们将发送验证码到您的手机
          </Paragraph>
        </div>
        <Form name="forgot-password" layout="vertical" onFinish={onFinish}>
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
              data-testid="inp-forgot-password-phone"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              data-testid="btn-forgot-password-submit"
            >
              发送验证码
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