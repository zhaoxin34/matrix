import { useCallback, useEffect, useState } from 'react'
import { Tree, Button, Dropdown, Spin, Tag, Tooltip, message } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  PoweroffOutlined,
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { OrgUnitTreeNode } from '@/types/org'
import { orgUnitApi } from '@/api/modules/orgUnit'

interface OrgTreeProps {
  selectedUnitId: number | null
  onSelect: (unit: OrgUnitTreeNode | null) => void
  onAdd: (parentId: number | null) => void
  onEdit: (unit: OrgUnitTreeNode) => void
  onDelete: (unit: OrgUnitTreeNode) => void
  onToggleStatus: (unit: OrgUnitTreeNode) => void
  refreshKey?: number
}

const TYPE_LABEL: Record<string, string> = {
  company: '公司',
  branch: '分支',
  department: '部门',
  sub_department: '子部门',
}

function flattenNodes(nodes: OrgUnitTreeNode[]): OrgUnitTreeNode[] {
  return nodes.flatMap((n) => [n, ...flattenNodes(n.children || [])])
}

function findNodeById(id: number, treeData: OrgUnitTreeNode[]): OrgUnitTreeNode | undefined {
  return flattenNodes(treeData).find((n) => n.id === id)
}

export function OrgTree({
  selectedUnitId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
  refreshKey,
}: OrgTreeProps) {
  const [treeData, setTreeData] = useState<OrgUnitTreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  const loadTree = useCallback(async () => {
    setLoading(true)
    try {
      const data = await orgUnitApi.getTree()
      setTreeData(data)
      setExpandedKeys((prev) => (prev.length === 0 && data.length > 0 ? [data[0].id] : prev))
    } catch {
      message.error('加载组织树失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTree()
  }, [loadTree, refreshKey])

  const renderTitle = (node: OrgUnitTreeNode): React.ReactNode => {
    const menuItems = [
      {
        key: 'add-child',
        icon: <PlusOutlined />,
        label: '添加子节点',
        onClick: () => onAdd(node.id),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => onEdit(node),
      },
      {
        key: 'toggle',
        icon: <PoweroffOutlined />,
        label: node.status === 'active' ? '禁用' : '启用',
        onClick: () => onToggleStatus(node),
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => onDelete(node),
      },
    ]

    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          style={{ color: node.status === 'inactive' ? '#999' : undefined, cursor: 'pointer' }}
          onClick={() => onSelect(node)}
        >
          {node.name}
        </span>
        <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>
          {TYPE_LABEL[node.type] || node.type}
        </Tag>
        {node.status === 'inactive' && (
          <Tag color="default" style={{ fontSize: 10, padding: '0 4px' }}>
            禁用
          </Tag>
        )}
        <Tooltip title={`直属: ${node.member_count} | 含下级: ${node.total_member_count}`}>
          <span style={{ fontSize: 12, color: '#999' }}>({node.total_member_count})</span>
        </Tooltip>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <EllipsisOutlined
            style={{ color: '#999', marginLeft: 'auto', cursor: 'pointer' }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    )
  }

  function buildTreeNodes(nodes: OrgUnitTreeNode[]): DataNode[] {
    return nodes.map((node) => ({
      key: node.id,
      title: renderTitle(node),
      children: node.children?.length ? buildTreeNodes(node.children) : undefined,
    }))
  }

  const treeNodes = buildTreeNodes(treeData)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600 }}>组织架构</span>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => onAdd(null)}>
          新增
        </Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <Tree
            treeData={treeNodes}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            selectedKeys={selectedUnitId ? [selectedUnitId] : []}
            onSelect={(keys) => {
              const id = keys[0] as number
              const node = findNodeById(id, treeData)
              onSelect(node || null)
            }}
            blockNode
          />
        )}
      </div>
    </div>
  )
}
