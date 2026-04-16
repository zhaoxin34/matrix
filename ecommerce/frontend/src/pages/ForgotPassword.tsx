import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Typography, Card, message } from 'antd'
import { PhoneOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import apiClient from '@/api/axios'

const { Title, Paragraph } = Typography

export function ForgotPassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'phone' | 'reset'>('phone')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const sendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      message.error('请输入有效的手机号')
      return
    }
    try {
      await apiClient.post('/auth/password-reset/request', { phone })
      setStep('reset')
      setCountdown(60)
      message.success('验证码已发送')
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '发送失败')
    }
  }

  const onFinish = async (values: { code: string; new_password: string; confirm_password: string }) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次密码不一致')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/auth/password-reset/confirm', {
        phone,
        code: values.code,
        new_password: values.new_password,
      })
      message.success('密码重置成功')
      navigate('/reset-success')
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '重置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '48px 24px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>找回密码</Title>
          <Paragraph style={{ color: '#666' }}>通过手机号重置密码</Paragraph>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号"
              size="large"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={step === 'reset'}
            />
          </Form.Item>

          {step === 'reset' && (
            <>
              <Form.Item
                label="验证码"
                name="code"
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码为6位数字' },
                ]}
              >
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="请输入验证码"
                  size="large"
                  suffix={
                    <Button
                      type="link"
                      size="small"
                      disabled={countdown > 0}
                      onClick={sendCode}
                    >
                      {countdown > 0 ? `${countdown}秒后重试` : '重新发送'}
                    </Button>
                  }
                />
              </Form.Item>

              <Form.Item
                label="新密码"
                name="new_password"
                rules={[
                  { required: true, message: '请输入新密码' },
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
                  placeholder="新密码（至少8位，需包含字母和数字）"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="确认密码"
                name="confirm_password"
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject('两次密码不一致')
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认新密码"
                  size="large"
                />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              {step === 'phone' ? '发送验证码' : '重置密码'}
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login">返回登录</Link>
        </div>
      </Card>
    </div>
  )
}
