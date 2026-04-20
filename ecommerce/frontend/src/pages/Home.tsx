import { Link } from 'react-router-dom'
import { Button, Card, Row, Col, Typography, message } from 'antd'
import { ShoppingOutlined, TeamOutlined, SafetyOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useCategoryTree } from '@/hooks/useProduct'

const { Title, Paragraph, Text } = Typography

export function Home() {
  const { categories, loading, error } = useCategoryTree()

  if (error) {
    message.error('加载分类失败')
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <Title level={1}>欢迎来到电商网站</Title>
        <Paragraph style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
          发现优质商品，享受便捷购物体验
        </Paragraph>
        <Link to="/products">
          <Button type="primary" size="large" icon={<ShoppingOutlined />}>
            开始购物
          </Button>
        </Link>
      </div>

      {/* Categories Section */}
      {!loading && (categories || []).length > 0 && (
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <AppstoreOutlined style={{ fontSize: 24, marginRight: 12, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>商品分类</Title>
          </div>
          <Row gutter={[16, 16]}>
            {categories.map(category => (
              <Col key={category.id} xs={12} sm={8} md={6}>
                <Link to={`/products?category_id=${category.id}`}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', height: '100%' }}
                    styles={{ body: { padding: 24 } }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                      <AppstoreOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>{category.name}</Text>
                    {(category.children || []).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {(category.children || []).slice(0, 3).map(child => (
                          <div key={child.id} style={{ fontSize: 12, color: '#666', padding: '2px 0' }}>
                            {child.name}
                          </div>
                        ))}
                        {(category.children || []).length > 3 && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            还有{(category.children || []).length - 3}个子分类
                          </Text>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/products">
              <Button size="large">查看全部商品</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Feature Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card>
            <Card.Meta
              avatar={<ShoppingOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
              title="精选商品"
              description="提供高品质、性价比高的商品"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Card.Meta
              avatar={<TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />}
              title="用户至上"
              description="全心全意为用户提供优质服务"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Card.Meta
              avatar={<SafetyOutlined style={{ fontSize: 32, color: '#faad14' }} />}
              title="安全支付"
              description="多重保障，安全快捷的支付方式"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}