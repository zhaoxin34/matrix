import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Typography, Button, Spin, message, InputNumber, Badge, Carousel, Tag, Divider, Card } from 'antd'
import { useState, useEffect } from 'react'
import { ShoppingCartOutlined, CheckCircleFilled } from '@ant-design/icons'
import { useProductDetail } from '@/hooks/useProduct'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/utils/format'

const { Title, Paragraph, Text } = Typography

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { product, loading, error, fetchProduct } = useProductDetail()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({})
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProduct(Number(id))
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

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://via.placeholder.com/600x600?text=No+Image']

  const getAvailableStock = () => {
    if (!product.sku_variants || product.sku_variants.length === 0) {
      return product.stock
    }
    return product.stock
  }

  const isInStock = getAvailableStock() > 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Row gutter={[32, 24]}>
        {/* Image Gallery */}
        <Col xs={24} md={12}>
          <div style={{ position: 'sticky', top: 24 }}>
            <Carousel
              afterChange={(current) => setCurrentImageIndex(current)}
              style={{ background: '#f5f5f5', borderRadius: 8 }}
            >
              {images.map((img, idx) => (
                <div key={idx} style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={img} alt={`${product.name} - ${idx + 1}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </Carousel>
            {images.length > 1 && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary">{currentImageIndex + 1} / {images.length}</Text>
              </div>
            )}
            {product.images && product.images.length > 1 && (
              <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
                {product.images.map((img, idx) => (
                  <Col span={6} key={idx}>
                    <div
                      onClick={() => setCurrentImageIndex(idx)}
                      style={{
                        cursor: 'pointer',
                        border: currentImageIndex === idx ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        borderRadius: 4,
                        overflow: 'hidden',
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5',
                      }}
                    >
                      <img src={img} alt={`thumbnail-${idx}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </Col>

        {/* Product Info */}
        <Col xs={24} md={12}>
          <div>
            {product.brand && <Tag color="blue" style={{ marginBottom: 8 }}>{product.brand}</Tag>}
            <Title level={2} style={{ marginBottom: 8 }}>{product.name}</Title>
            <Paragraph style={{ color: '#666', fontSize: 14 }}>{product.description}</Paragraph>

            <Card size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <Title level={2} style={{ color: '#ff4d4f', margin: 0 }}>
                  {formatCurrency(product.price)}
                </Title>
                {product.original_price && product.original_price > product.price && (
                  <Text delete style={{ color: '#999', fontSize: 16 }}>
                    {formatCurrency(product.original_price)}
                  </Text>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <Badge status={isInStock ? 'success' : 'error'} text={isInStock ? `有货 (${product.stock}件)` : '缺货'} />
                {product.sales_count > 0 && (
                  <Text type="secondary" style={{ marginLeft: 16 }}>销量: {product.sales_count}</Text>
                )}
              </div>
            </Card>

            {/* SKU Variants */}
            {product.sku_variants && product.sku_variants.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {product.sku_variants.map((variant, idx) => {
                  const keys = Object.keys(variant)
                  const variantName = keys[0]
                  const options = variant[variantName]
                  return (
                    <div key={idx} style={{ marginBottom: 16 }}>
                      <Text strong style={{ marginBottom: 8, display: 'block' }}>{variantName}:</Text>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {options.map(opt => (
                          <Button
                            key={opt}
                            type={selectedVariant[variantName] === opt ? 'primary' : 'default'}
                            onClick={() => setSelectedVariant(v => ({ ...v, [variantName]: opt }))}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>数量:</Text>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <InputNumber
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                  disabled={!isInStock}
                />
                <Text type="secondary">库存: {product.stock}</Text>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                disabled={!isInStock}
              >
                加入购物车
              </Button>
              <Button size="large" onClick={() => navigate('/cart')}>
                查看购物车
              </Button>
            </div>

            <Divider />

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <Text strong style={{ fontSize: 16 }}>规格参数</Text>
                <Card size="small" style={{ marginTop: 12 }}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <Row key={key} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <Col span={8}><Text type="secondary">{key}</Text></Col>
                      <Col span={16}><Text>{value}</Text></Col>
                    </Row>
                  ))}
                </Card>
              </div>
            )}

            <div style={{ marginTop: 24, color: '#999', fontSize: 12 }}>
              <p>商品ID: {product.id}</p>
              <p>上架时间: {product.created_at}</p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}