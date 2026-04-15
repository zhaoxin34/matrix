import { Table, Tag, Typography, Card, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Order, OrderStatus } from '@/types/order'

const { Title, Paragraph } = Typography

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'blue', text: '已支付' },
  shipped: { color: 'cyan', text: '已发货' },
  delivered: { color: 'green', text: '已送达' },
  cancelled: { color: 'red', text: '已取消' },
}

const mockOrders: Order[] = []

export function OrderList() {
  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
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
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
    },
    {
      title: '收货地址',
      dataIndex: 'shippingAddress',
      key: 'shippingAddress',
      render: (address) =>
        `${address.province}${address.city}${address.district}${address.street}`,
    },
  ]

  if (mockOrders.length === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <Title level={2}>我的订单</Title>
        <Empty description="暂无订单">
          <Paragraph style={{ color: '#666' }}>快去购物吧</Paragraph>
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
          dataSource={mockOrders}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
