import { Link } from 'react-router-dom'
import { Button, Card, Row, Col, Typography } from 'antd'
import { ShoppingOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export function Home() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
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
