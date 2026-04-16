import { Link } from 'react-router-dom'
import { Result, Button } from 'antd'

export function ResetSuccess() {

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
