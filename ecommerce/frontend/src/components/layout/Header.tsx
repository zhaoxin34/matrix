import { Link, useNavigate } from 'react-router-dom'
import { Menu, Dropdown, Badge, Button } from 'antd'
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'

export function Header() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { itemCount } = useCart()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const userMenuItems = [
        { key: 'profile', label: <Link to="/profile">个人中心</Link> },
        { key: 'orders', label: <Link to="/orders">我的订单</Link> },
        { type: 'divider' as const },
        { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
      ]

  return (
    <header style={{ height: 64, background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/" style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
            电商网站
          </Link>
          <Menu
            mode="horizontal"
            style={{ border: 'none', background: 'transparent' }}
            items={[
              { key: 'home', label: <Link to="/">首页</Link> },
              { key: 'products', label: <Link to="/products">商品</Link> },
            ]}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/cart">
            <Badge count={itemCount} size="small">
              <Button icon={<ShoppingCartOutlined />}>购物车</Button>
            </Badge>
          </Link>

          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined />
                {user?.name || '用户'}
              </span>
            </Dropdown>
          ) : (
            <Link to="/login">
              <Button icon={<UserOutlined />}>登录</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
