import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Spin } from 'antd'
import { ApartmentOutlined, TeamOutlined, UserOutlined, UserAddOutlined } from '@ant-design/icons'
import type { OrgDashboard } from '@/types/org'
import { orgDashboardApi } from '@/api/modules/orgDashboard'

interface DashboardStatsProps {
  refreshKey?: number
}

export function DashboardStats({ refreshKey }: DashboardStatsProps) {
  const [data, setData] = useState<OrgDashboard | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    orgDashboardApi
      .getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <Spin style={{ display: 'block', textAlign: 'center', padding: 16 }} />

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="组织单元"
            value={data?.org_count ?? 0}
            prefix={<ApartmentOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="员工总数"
            value={data?.total_employees ?? 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="在职"
            value={data?.on_job ?? 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="入职中"
            value={data?.onboarding ?? 0}
            prefix={<UserAddOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
