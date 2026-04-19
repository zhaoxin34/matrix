import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Typography, Card, Empty, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency, formatDate } from '@/utils/format'
import { orderApi } from '@/api/modules/order'
import type { Order, OrderStatus } from '@/types/order'

const { Title, Paragraph } = Typography

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'blue', text: '已支付' },
  shipped: { color: 'cyan', text: '已发货' },
  delivered: { color: 'green', text: '已送达' },
  cancelled: { color: 'red', text: '已取消' },
}

const getOrderNumber = (order: Order): string => {
  return `ORD-${order.id.toString().padStart(8, '0')}`
}

export function OrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await orderApi.list()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'orderNumber',
      render: (_, order) => (
        <span style={{ fontFamily: 'monospace' }}>{getOrderNumber(order)}</span>
      ),
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'totalAmount',
      render: (amount) => formatCurrency(amount),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      ),
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'createdAt',
      render: (date) => formatDate(date),
    },
    {
      title: '收货地址',
      key: 'address',
      render: (_, order) =>
        order.province && order.city && order.district && order.street
          ? `${order.province}${order.city}${order.district}${order.street}`
          : '-',
    },
  ]

  if (orders.length === 0 && !loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <Title level={2}>我的订单</Title>
        <Empty description="暂无订单">
          <Paragraph style={{ color: '#666' }}>快去购物吧</Paragraph>
          <Button type="primary" onClick={() => navigate('/products')}>
            去购物
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>我的订单</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
          onRow={(record) => ({
            onClick: () => navigate(`/orders/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}