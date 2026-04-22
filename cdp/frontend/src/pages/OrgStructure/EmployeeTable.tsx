import { useCallback, useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  Input,
  Select,
  Tooltip,
  message,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  UploadOutlined,
  DownloadOutlined,
  LinkOutlined,
  DisconnectOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Employee, EmployeeStatus, OrgUnitTreeNode } from '@/types/org'
import { employeeApi } from '@/api/modules/employee'

interface EmployeeTableProps {
  selectedUnit: OrgUnitTreeNode | null
  onAdd: () => void
  onEdit: (emp: Employee) => void
  onDelete: (emp: Employee) => void
  onTransfer: (emp: Employee) => void
  onBindUser: (emp: Employee) => void
  refreshKey?: number
}

const STATUS_OPTIONS = [
  { value: 'onboarding', label: '入职中' },
  { value: 'on_job', label: '在职' },
  { value: 'transferring', label: '调动中' },
  { value: 'offboarding', label: '离职' },
]

const STATUS_COLOR: Record<EmployeeStatus, string> = {
  onboarding: 'processing',
  on_job: 'success',
  transferring: 'warning',
  offboarding: 'default',
}

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  onboarding: '入职中',
  on_job: '在职',
  transferring: '调动中',
  offboarding: '离职',
}

export function EmployeeTable({
  selectedUnit,
  onAdd,
  onEdit,
  onDelete,
  onTransfer,
  onBindUser,
  refreshKey,
}: EmployeeTableProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | undefined>(undefined)
  const [includeSubordinates, setIncludeSubordinates] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const result = await employeeApi.list({
        unit_id: selectedUnit?.id,
        include_subordinates: includeSubordinates,
        status: statusFilter,
        keyword: keyword || undefined,
        page,
        page_size: pageSize,
      })
      setEmployees(result.items)
      setTotal(result.total)
    } catch {
      message.error('加载员工列表失败')
    } finally {
      setLoading(false)
    }
  }, [selectedUnit, includeSubordinates, statusFilter, keyword, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [selectedUnit, includeSubordinates, statusFilter, keyword, refreshKey])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees, refreshKey])

  const handleUnbindUser = async (emp: Employee) => {
    try {
      await employeeApi.unbindUser(emp.id)
      message.success('解绑成功')
      loadEmployees()
    } catch {
      message.error('解绑失败')
    }
  }

  const handleExport = async () => {
    try {
      await employeeApi.exportExcel({
        unit_id: selectedUnit?.id,
        include_subordinates: includeSubordinates,
        status: statusFilter,
      })
    } catch {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<Employee> = [
    { title: '工号', dataIndex: 'employee_no', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '职位', dataIndex: 'position', width: 120 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: EmployeeStatus) => (
        <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
      ),
    },
    {
      title: '账号',
      dataIndex: 'user_mapping',
      width: 80,
      render: (mapping) =>
        mapping ? (
          <Tag color="green">已绑定</Tag>
        ) : (
          <Tag color="default">未绑定</Tag>
        ),
    },
    { title: '入职日期', dataIndex: 'entry_date', width: 110 },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, emp) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(emp)} />
          </Tooltip>
          <Tooltip title="调动">
            <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => onTransfer(emp)} />
          </Tooltip>
          {emp.user_mapping ? (
            <Tooltip title="解绑账号">
              <Popconfirm title="确认解绑账号？" onConfirm={() => handleUnbindUser(emp)}>
                <Button type="link" size="small" icon={<DisconnectOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="绑定账号">
              <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => onBindUser(emp)} />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm title="确认删除该员工？" onConfirm={() => onDelete(emp)}>
              <Button type="link" size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, minWidth: 80 }}>
          {selectedUnit ? `${selectedUnit.name} - 员工` : '全部员工'}
        </span>
        <Input.Search
          placeholder="搜索姓名/工号/电话"
          allowClear
          style={{ width: 200 }}
          onSearch={setKeyword}
        />
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 120 }}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
        {selectedUnit && (
          <Select
            value={includeSubordinates}
            style={{ width: 120 }}
            options={[
              { value: false, label: '仅直属' },
              { value: true, label: '含下级' },
            ]}
            onChange={setIncludeSubordinates}
          />
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={async (file) => {
              try {
                const result = await employeeApi.importExcel(file)
                message.success(`导入成功 ${result.success} 条`)
                if (result.errors.length > 0) {
                  message.warning(`${result.errors.length} 条失败`)
                }
                loadEmployees()
              } catch {
                message.error('导入失败')
              }
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>导入</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            新增员工
          </Button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </div>
    </div>
  )
}
