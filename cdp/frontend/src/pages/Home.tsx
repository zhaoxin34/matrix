import { Link } from "react-router-dom";
import { Typography, Card, Row, Col, Button, Space } from "antd";
import {
  TeamOutlined,
  SafetyOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export function Home() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      {/* Hero 区域 - 带渐变背景 */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 64,
          padding: "48px 24px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 16,
          color: "#fff",
        }}
      >
        <Title
          level={1}
          style={{
            color: "#fff",
            fontSize: 36,
            marginBottom: 16,
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          欢迎来到CDP平台
        </Title>
        <Paragraph
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 32,
          }}
        >
          客户数据平台，助您更好地管理和分析客户数据
        </Paragraph>
        <Space size="middle">
          <Link to="/login">
            <Button
              size="large"
              style={{
                background: "#fff",
                color: "#667eea",
                border: "none",
                fontWeight: 600,
              }}
              data-testid="btn-home-login"
            >
              登录
            </Button>
          </Link>
          <Link to="/register">
            <Button
              size="large"
              style={{
                background: "transparent",
                color: "#fff",
                border: "2px solid #fff",
                fontWeight: 600,
              }}
              data-testid="btn-home-register"
            >
              注册
            </Button>
          </Link>
        </Space>
      </div>

      {/* 功能卡片区域 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            data-testid="card-customer-mgmt"
            style={{
              borderRadius: 12,
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            styles={{
              body: { padding: 24 },
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <TeamOutlined style={{ fontSize: 32, color: "#1890ff" }} />
              </div>
              <Card.Meta
                title={
                  <span style={{ fontSize: 18, fontWeight: 600 }}>
                    客户管理
                  </span>
                }
                description={
                  <span style={{ color: "#8c8c8c" }}>
                    统一管理客户信息，构建完整的客户画像
                  </span>
                }
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            data-testid="card-data-integration"
            style={{
              borderRadius: 12,
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            styles={{
              body: { padding: 24 },
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <DatabaseOutlined style={{ fontSize: 32, color: "#52c41a" }} />
              </div>
              <Card.Meta
                title={
                  <span style={{ fontSize: 18, fontWeight: 600 }}>
                    数据整合
                  </span>
                }
                description={
                  <span style={{ color: "#8c8c8c" }}>
                    整合多渠道数据，打破数据孤岛
                  </span>
                }
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            data-testid="card-security"
            style={{
              borderRadius: 12,
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            styles={{
              body: { padding: 24 },
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <SafetyOutlined style={{ fontSize: 32, color: "#faad14" }} />
              </div>
              <Card.Meta
                title={
                  <span style={{ fontSize: 18, fontWeight: 600 }}>
                    安全可靠
                  </span>
                }
                description={
                  <span style={{ color: "#8c8c8c" }}>
                    多重保障，确保数据安全和隐私合规
                  </span>
                }
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}