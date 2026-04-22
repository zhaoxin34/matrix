import { useEffect } from 'react'
import { Modal, Form, InputNumber } from 'antd'
import type { Employee } from '@/types/org'

interface BindUserModalProps {
  open: boolean
  employee: Employee | null
  onOk: (userId: number) => Promise<void>
  onCancel: () => void
}

export function BindUserModal({ open, employee, onOk, onCancel }: BindUserModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.resetFields()
    }
  }, [open, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk(values.user_id)
  }

  return (
    <Modal
      title={`绑定账号 - ${employee?.name || ''}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="user_id"
          label="用户 ID"
          rules={[{ required: true, message: '请输入用户 ID' }]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="请输入要绑定的用户 ID" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
