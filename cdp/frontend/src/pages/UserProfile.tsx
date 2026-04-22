import { Form, Input, Button, Typography, Card, Avatar, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';

const { Title, Paragraph } = Typography;

export function UserProfile() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: unknown) => {
    console.log('Profile updated:', values);
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('个人信息更新成功');
    } catch {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>个人中心</Title>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <Title level={4} style={{ marginTop: 16 }}>
            {user?.username || '用户'}
          </Title>
          <Paragraph style={{ color: '#666' }}>{user?.email || user?.phone}</Paragraph>
        </div>
      </Card>

      <Card>
        <Title level={4}>编辑个人信息</Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: user?.username,
            email: user?.email || '',
            phone: user?.phone || '',
          }}
          onFinish={onFinish}
        >
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} data-testid="inp-profile-username" />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true }, { type: 'email' }]}>
            <Input prefix={<MailOutlined />} disabled data-testid="inp-profile-email" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input prefix={<PhoneOutlined />} data-testid="inp-profile-phone" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} data-testid="btn-profile-submit">
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}