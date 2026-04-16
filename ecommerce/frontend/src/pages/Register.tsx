import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Typography, Card, message, Checkbox, Popover } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, SafetyOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'

const { Title, Paragraph } = Typography

export function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const sendSmsCode = async (phoneNumber: string) => {
    try {
      await apiClient.post('/auth/sms/send', { phone: phoneNumber })
      setSmsSent(true)
      setCountdown(60)
      message.success('验证码已发送')
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '发送失败')
    }
  }

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhone(value)
    if (/^1[3-9]\d{9}$/.test(value) && !smsSent) {
      sendSmsCode(value)
    }
  }

  const onFinish = async (values: {
    username: string
    phone: string
    password: string
    sms_code: string
    terms: boolean
  }) => {
    if (!values.terms) {
      message.error('请同意服务条款')
      return
    }
    setLoading(true)
    try {
      await register({
        username: values.username,
        phone: values.phone,
        password: values.password,
      })
      message.success('注册成功')
      navigate('/')
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const passwordChecker = (
    <div style={{ padding: 8 }}>
      <div style={{ color: /[A-Za-z]/.test('') ? '#52c41a' : '#999' }}>○ 包含字母</div>
      <div style={{ color: /\d/.test('') ? '#52c41a' : '#999' }}>○ 包含数字</div>
      <div style={{ color: (''.length >= 8) ? '#52c41a' : '#999' }}>○ 至少8位</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '48px 24px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>注册</Title>
          <Paragraph style={{ color: '#666' }}>创建新账号</Paragraph>
        </div>
        <Form name="register" layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="手机号"
              size="large"
              onChange={onPhoneChange}
            />
          </Form.Item>
          <Form.Item
            name="sms_code"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为6位数字' },
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="验证码"
              size="large"
              disabled={!smsSent}
              suffix={
                <Button
                  type="link"
                  size="small"
                  disabled={countdown > 0}
                  onClick={() => sendSmsCode(phone)}
                >
                  {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少8位' },
              {
                validator: (_, value) =>
                  /[A-Za-z]/.test(value) && /\d/.test(value)
                    ? Promise.resolve()
                    : Promise.reject('密码需包含字母和数字'),
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（至少8位，需包含字母和数字）"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject('请同意服务条款'),
              },
            ]}
          >
            <Checkbox>
              我已阅读并同意<Link to="/terms">《服务条款》</Link>和<Link to="/privacy">《隐私政策》</Link>
            </Checkbox>
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
          已有账号？<Link to="/login">立即登录</Link>
        </div>
      </Card>
    </div>
  )
}
