import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography, Spin, message } from 'antd'
import { useProductList } from '@/hooks/useProduct'
import { formatCurrency } from '@/utils/format'

const { Title, Paragraph } = Typography

export function ProductList() {
  const navigate = useNavigate()
  const { products, loading, error } = useProductList()

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    message.error('加载商品失败')
    return null
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>商品列表</Title>
      <Row gutter={[16, 16]}>
        {products.map((product) => (
          <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => navigate(`/products/${product.id}`)}
              cover={
                <div
                  style={{
                    height: 200,
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Paragraph style={{ color: '#999' }}>商品图片</Paragraph>
                </div>
              }
            >
              <Card.Meta
                title={product.name}
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }}>{product.description}</Paragraph>
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
