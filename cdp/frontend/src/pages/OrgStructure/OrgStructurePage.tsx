import { useState } from 'react'
import { Layout, message } from 'antd'
import type { Employee, EmployeeCreate, EmployeeTransferCreate, EmployeeUpdate, OrgUnitCreate, OrgUnitTreeNode, OrgUnitUpdate } from '@/types/org'
import { orgUnitApi } from '@/api/modules/orgUnit'
import { employeeApi } from '@/api/modules/employee'
import { OrgTree } from './OrgTree'
import { OrgUnitModal } from './OrgUnitModal'
import { EmployeeTable } from './EmployeeTable'
import { EmployeeModal } from './EmployeeModal'
import { TransferModal } from './TransferModal'
import { BindUserModal } from './BindUserModal'
import { DashboardStats } from './DashboardStats'

const { Sider, Content } = Layout

export function OrgStructurePage() {
  const [selectedUnit, setSelectedUnit] = useState<OrgUnitTreeNode | null>(null)
  const [treeRefreshKey, setTreeRefreshKey] = useState(0)
  const [empRefreshKey, setEmpRefreshKey] = useState(0)

  // Org unit modal state
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const [orgModalMode, setOrgModalMode] = useState<'create' | 'edit'>('create')
  const [orgModalParentId, setOrgModalParentId] = useState<number | null>(null)
  const [editingUnit, setEditingUnit] = useState<OrgUnitTreeNode | null>(null)

  // Employee modal state
  const [empModalOpen, setEmpModalOpen] = useState(false)
  const [empModalMode, setEmpModalMode] = useState<'create' | 'edit'>('create')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null)

  // Bind user modal
  const [bindModalOpen, setBindModalOpen] = useState(false)
  const [bindEmployee, setBindEmployee] = useState<Employee | null>(null)

  const refreshAll = () => {
    setTreeRefreshKey((k) => k + 1)
    setEmpRefreshKey((k) => k + 1)
  }

  // ---- Org unit handlers ----
  const handleAddUnit = (parentId: number | null) => {
    setOrgModalMode('create')
    setOrgModalParentId(parentId)
    setEditingUnit(null)
    setOrgModalOpen(true)
  }

  const handleEditUnit = (unit: OrgUnitTreeNode) => {
    setOrgModalMode('edit')
    setEditingUnit(unit)
    setOrgModalOpen(true)
  }

  const handleDeleteUnit = async (unit: OrgUnitTreeNode) => {
    try {
      await orgUnitApi.delete(unit.id)
      message.success('删除成功')
      if (selectedUnit?.id === unit.id) setSelectedUnit(null)
      setTreeRefreshKey((k) => k + 1)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err?.response?.data?.detail || '删除失败')
    }
  }

  const handleToggleStatus = async (unit: OrgUnitTreeNode) => {
    try {
      await orgUnitApi.toggleStatus(unit.id)
      message.success('状态更新成功')
      setTreeRefreshKey((k) => k + 1)
    } catch {
      message.error('操作失败')
    }
  }

  const handleOrgModalOk = async (data: OrgUnitCreate | OrgUnitUpdate) => {
    try {
      if (orgModalMode === 'create') {
        await orgUnitApi.create({ ...(data as OrgUnitCreate), parent_id: orgModalParentId })
        message.success('创建成功')
      } else {
        await orgUnitApi.update(editingUnit!.id, data as OrgUnitUpdate)
        message.success('更新成功')
      }
      setOrgModalOpen(false)
      setTreeRefreshKey((k) => k + 1)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err?.response?.data?.detail || '操作失败')
    }
  }

  // ---- Employee handlers ----
  const handleAddEmployee = () => {
    setEmpModalMode('create')
    setEditingEmployee(null)
    setEmpModalOpen(true)
  }

  const handleEditEmployee = (emp: Employee) => {
    setEmpModalMode('edit')
    setEditingEmployee(emp)
    setEmpModalOpen(true)
  }

  const handleDeleteEmployee = async (emp: Employee) => {
    try {
      await employeeApi.delete(emp.id)
      message.success('删除成功')
      setEmpRefreshKey((k) => k + 1)
    } catch {
      message.error('删除失败')
    }
  }

  const handleEmpModalOk = async (data: EmployeeCreate | EmployeeUpdate) => {
    try {
      if (empModalMode === 'create') {
        await employeeApi.create(data as EmployeeCreate)
        message.success('创建成功')
      } else {
        await employeeApi.update(editingEmployee!.id, data as EmployeeUpdate)
        message.success('更新成功')
      }
      setEmpModalOpen(false)
      refreshAll()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err?.response?.data?.detail || '操作失败')
    }
  }

  // ---- Transfer handlers ----
  const handleTransfer = (emp: Employee) => {
    setTransferEmployee(emp)
    setTransferModalOpen(true)
  }

  const handleTransferOk = async (data: EmployeeTransferCreate) => {
    try {
      await employeeApi.initiateTransfer(transferEmployee!.id, data)
      message.success('调动发起成功')
      setTransferModalOpen(false)
      setEmpRefreshKey((k) => k + 1)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err?.response?.data?.detail || '发起调动失败')
    }
  }

  // ---- Bind user handlers ----
  const handleBindUser = (emp: Employee) => {
    setBindEmployee(emp)
    setBindModalOpen(true)
  }

  const handleBindUserOk = async (userId: number) => {
    try {
      await employeeApi.bindUser(bindEmployee!.id, userId)
      message.success('绑定成功')
      setBindModalOpen(false)
      setEmpRefreshKey((k) => k + 1)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err?.response?.data?.detail || '绑定失败')
    }
  }

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <DashboardStats refreshKey={treeRefreshKey} />

      <Layout
        style={{
          flex: 1,
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <Sider
          width={280}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
          }}
        >
          <OrgTree
            selectedUnitId={selectedUnit?.id ?? null}
            onSelect={setSelectedUnit}
            onAdd={handleAddUnit}
            onEdit={handleEditUnit}
            onDelete={handleDeleteUnit}
            onToggleStatus={handleToggleStatus}
            refreshKey={treeRefreshKey}
          />
        </Sider>
        <Content style={{ overflow: 'auto', background: '#fff' }}>
          <EmployeeTable
            selectedUnit={selectedUnit}
            onAdd={handleAddEmployee}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            onTransfer={handleTransfer}
            onBindUser={handleBindUser}
            refreshKey={empRefreshKey}
          />
        </Content>
      </Layout>

      <OrgUnitModal
        open={orgModalOpen}
        mode={orgModalMode}
        parentId={orgModalParentId}
        editingUnit={editingUnit}
        onOk={handleOrgModalOk}
        onCancel={() => setOrgModalOpen(false)}
      />

      <EmployeeModal
        open={empModalOpen}
        mode={empModalMode}
        editingEmployee={editingEmployee}
        defaultUnitId={selectedUnit?.id}
        onOk={handleEmpModalOk}
        onCancel={() => setEmpModalOpen(false)}
      />

      <TransferModal
        open={transferModalOpen}
        employee={transferEmployee}
        onOk={handleTransferOk}
        onCancel={() => setTransferModalOpen(false)}
      />

      <BindUserModal
        open={bindModalOpen}
        employee={bindEmployee}
        onOk={handleBindUserOk}
        onCancel={() => setBindModalOpen(false)}
      />
    </div>
  )
}
