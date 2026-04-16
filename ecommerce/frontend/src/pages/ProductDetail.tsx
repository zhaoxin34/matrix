import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Typography, Button, Spin, message, InputNumber } from 'antd'
import { useState, useEffect } from 'react'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { useProductDetail } from '@/hooks/useProduct'
import { useCart } from '@/hooks/useCart'
import { formatCurrency, formatDate } from '@/utils/format'

const { Title, Paragraph } = Typography

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { product, loading, error, fetchProduct } = useProductDetail()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (id) {
      fetchProduct(id)
    }
  }, [id, fetchProduct])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !product) {
    message.error('商品不存在')
    return null
  }

  const handleAddToCart = () => {
    addItem({ productId: product.id, quantity })
    message.success('已添加到购物车')
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <div
            style={{
              height: 400,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paragraph style={{ color: '#999' }}>商品图片</Paragraph>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Title level={2}>{product.name}</Title>
          <Paragraph style={{ color: '#666', fontSize: 16 }}>{product.description}</Paragraph>
          <div style={{ margin: '24px 0' }}>
            <Title level={2} style={{ color: '#ff4d4f' }}>
              {formatCurrency(product.price)}
            </Title>
            <Paragraph>库存: {product.stock}</Paragraph>
          </div>
          <div style={{ marginBottom: 24 }}>
            <Paragraph style={{ marginBottom: 8 }}>数量:</Paragraph>
            <InputNumber
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(value) => setQuantity(value || 1)}
            />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
            >
              加入购物车
            </Button>
            <Button size="large" onClick={() => navigate('/cart')}>
              查看购物车
            </Button>
          </div>
          <Paragraph style={{ marginTop: 24, color: '#999' }}>
            创建时间: {formatDate(product.createdAt)}
          </Paragraph>
        </Col>
      </Row>
    </div>
  )
}
