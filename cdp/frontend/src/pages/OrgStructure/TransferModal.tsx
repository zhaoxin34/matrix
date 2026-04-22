import { useEffect } from 'react'
import { Modal, Form, Select, DatePicker, Input, InputNumber } from 'antd'
import type { Employee, EmployeeTransferCreate } from '@/types/org'

interface TransferModalProps {
  open: boolean
  employee: Employee | null
  onOk: (data: EmployeeTransferCreate) => Promise<void>
  onCancel: () => void
}

const TRANSFER_TYPE_OPTIONS = [
  { value: 'promotion', label: '晋升' },
  { value: 'demotion', label: '降职' },
  { value: 'transfer', label: '平调' },
]

export function TransferModal({ open, employee, onOk, onCancel }: TransferModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    const data: EmployeeTransferCreate = {
      to_unit_id: values.to_unit_id,
      transfer_type: values.transfer_type,
      effective_date: values.effective_date.format('YYYY-MM-DD'),
      reason: values.reason || null,
    }
    await onOk(data)
  }

  return (
    <Modal
      title={`发起调动 - ${employee?.name || ''}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="to_unit_id"
          label="目标部门 ID"
          rules={[{ required: true, message: '请输入目标部门 ID' }]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="请输入目标部门 ID" />
        </Form.Item>
        <Form.Item
          name="transfer_type"
          label="调动类型"
          rules={[{ required: true, message: '请选择调动类型' }]}
        >
          <Select options={TRANSFER_TYPE_OPTIONS} placeholder="请选择" />
        </Form.Item>
        <Form.Item
          name="effective_date"
          label="生效日期"
          rules={[{ required: true, message: '请选择生效日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="reason" label="调动原因">
          <Input.TextArea rows={3} placeholder="请输入调动原因（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
