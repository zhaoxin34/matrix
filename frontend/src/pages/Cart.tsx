import { Link } from 'react-router-dom'
import { Table, Button, InputNumber, Typography, Empty, Card } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined } from '@ant-design/icons'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/utils/format'
import type { CartItem } from '@/types/product'

const { Title, Paragraph } = Typography

export function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()

  const columns: ColumnsType<CartItem> = [
    {
      title: '商品',
      dataIndex: 'product',
      key: 'product',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paragraph style={{ color: '#999' }}>图片</Paragraph>
          </div>
          <Link to={`/products/${record.product.id}`}>{record.product.name}</Link>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (_, record) => formatCurrency(record.product.price),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_, record) => (
        <InputNumber
          min={1}
          max={record.product.stock}
          value={record.quantity}
          onChange={(value) =>
            updateQuantity(record.product.id, value || 1)
          }
        />
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      render: (_, record) =>
        formatCurrency(record.product.price * record.quantity),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.product.id)}
        >
          删除
        </Button>
      ),
    },
  ]

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <Empty description="购物车是空的">
          <Link to="/products">
            <Button type="primary">去购物</Button>
          </Link>
        </Empty>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>购物车</Title>
      <Table
        columns={columns}
        dataSource={items}
        rowKey={(record) => record.product.id}
        pagination={false}
      />
      <Card style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Button danger onClick={clearCart}>
              清空购物车
            </Button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Paragraph style={{ fontSize: 16 }}>
              共 {items.length} 件商品，总计:{' '}
              <span style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}>
                {formatCurrency(total)}
              </span>
            </Paragraph>
            <Link to="/checkout">
              <Button type="primary" size="large">
                去结算
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
