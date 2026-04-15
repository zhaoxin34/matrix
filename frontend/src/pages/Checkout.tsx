import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Typography, Card, message, Steps } from 'antd'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/utils/format'
import { useState } from 'react'

const { Title, Paragraph } = Typography

export function Checkout() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: unknown) => {
    console.log('Order submitted:', values)
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success('订单提交成功')
      clearCart()
      navigate('/orders')
    } catch {
      message.error('订单提交失败')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <Paragraph style={{ fontSize: 16 }}>购物车是空的</Paragraph>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>确认订单</Title>
      <Steps current={0} style={{ marginBottom: 32 }} items={[{ title: '确认订单' }, { title: '支付' }, { title: '完成' }]} />
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>商品清单</Title>
        {items.map((item) => (
          <div
            key={item.product.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <span>{item.product.name}</span>
            <span>
              {item.quantity} x {formatCurrency(item.product.price)} ={' '}
              {formatCurrency(item.product.price * item.quantity)}
            </span>
          </div>
        ))}
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Title level={4} style={{ color: '#ff4d4f' }}>
            总计: {formatCurrency(total)}
          </Title>
        </div>
      </Card>

      <Card>
        <Title level={4}>收货信息</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="收货人姓名" name="recipientName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="省份" name="province" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="城市" name="city" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="区县" name="district" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="详细地址" name="street" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              提交订单
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
