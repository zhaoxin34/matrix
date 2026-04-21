import { Typography, Card, Row, Col } from 'antd';
import { TeamOutlined, SafetyOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export function Home() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <Title level={1}>欢迎来到CDP平台</Title>
        <Paragraph style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
          客户数据平台，助您更好地管理和分析客户数据
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card>
            <Card.Meta
              avatar={<TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
              title="客户管理"
              description="统一管理客户信息，构建完整的客户画像"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Card.Meta
              avatar={<DatabaseOutlined style={{ fontSize: 32, color: '#52c41a' }} />}
              title="数据整合"
              description="整合多渠道数据，打破数据孤岛"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Card.Meta
              avatar={<SafetyOutlined style={{ fontSize: 32, color: '#faad14' }} />}
              title="安全可靠"
              description="多重保障，确保数据安全和隐私合规"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
