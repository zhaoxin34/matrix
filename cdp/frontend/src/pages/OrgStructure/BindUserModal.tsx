import { useEffect } from 'react'
import { Modal, Form, InputNumber, Button } from 'antd'
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
      onCancel={onCancel}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel} data-testid="btn-bind-cancel">
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleOk} data-testid="btn-bind-confirm">
          确认
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="user_id"
          label="用户 ID"
          rules={[{ required: true, message: '请输入用户 ID' }]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="请输入要绑定的用户 ID" data-testid="inp-bind-user-id" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
