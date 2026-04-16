import { useNavigate, Link } from 'react-router-dom'
import { Result, Button, Typography } from 'antd'

const { Title, Paragraph } = Typography

export function ResetSuccess() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '48px 24px' }}>
      <Result
        status="success"
        title="密码重置成功"
        subTitle="您的密码已成功修改，请使用新密码登录"
        extra={
          <Link to="/login">
            <Button type="primary" size="large">
              返回登录
            </Button>
          </Link>
        }
      />
    </div>
  )
}
