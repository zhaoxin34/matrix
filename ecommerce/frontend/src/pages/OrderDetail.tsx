import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Tag, Spin, Button } from 'antd';
import { formatCurrency, formatDate } from '@/utils/format';
import { orderApi } from '@/api/modules/order';
import type { Order, OrderStatus } from '@/types/order';

const { Title, Text } = Typography;

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'blue', text: '已支付' },
  shipped: { color: 'cyan', text: '已发货' },
  delivered: { color: 'green', text: '已送达' },
  cancelled: { color: 'red', text: '已取消' },
};

const getOrderNumber = (order: Order): string => {
  return `ORD-${order.id.toString().padStart(8, '0')}`;
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await orderApi.detail(Number(id));
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>订单详情</Title>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>订单信息</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <Text strong>订单号: </Text>
            <Text style={{ fontFamily: 'monospace' }}>{getOrderNumber(order)}</Text>
          </div>
          <div>
            <Text strong>订单状态: </Text>
            <Tag color={statusMap[order.status].color}>{statusMap[order.status].text}</Tag>
          </div>
          <div>
            <Text strong>下单时间: </Text>
            <Text>{formatDate(order.created_at)}</Text>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>商品清单</Title>
        {order.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Text>
              {item.product_name || `商品 #${item.product_id}`} x {item.quantity}
            </Text>
            <Text>{formatCurrency(item.price * item.quantity)}</Text>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>收货地址</Title>
        <div>
          <Text>{order.recipient_name}</Text>
          <Text style={{ marginLeft: 8 }}>{order.phone}</Text>
        </div>
        <Text>
          {order.province}
          {order.city}
          {order.district}
          {order.street}
        </Text>
      </Card>

      <div style={{ textAlign: 'right', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#ff4d4f' }}>
          总计: {formatCurrency(order.total_amount)}
        </Title>
      </div>

      <Button type="text" onClick={() => navigate('/orders')}>
        返回
      </Button>
    </div>
  );
}
