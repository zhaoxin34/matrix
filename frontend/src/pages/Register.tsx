import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Typography, Card, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

const { Title, Paragraph } = Typography

export function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: {
    email: string
    password: string
    name: string
    phone?: string
  }) => {
    setLoading(true)
    try {
      await register(values)
      message.success('注册成功')
      navigate('/')
    } catch {
      message.error('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '48px 24px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>注册</Title>
          <Paragraph style={{ color: '#666' }}>创建新账号</Paragraph>
        </div>
        <Form name="register" layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          <Form.Item name="phone">
            <Input prefix={<UserOutlined />} placeholder="手机号（可选）" size="large" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || isLoading}
              size="large"
              block
            >
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          已有账号?{' '}
          <Link to="/login">立即登录</Link>
        </div>
      </Card>
    </div>
  )
}
