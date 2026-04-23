import { useEffect, useState, useCallback } from "react";
import { Modal, Form, Button, Select, Spin } from "antd";
import type { Employee } from "@/types/org";
import { userApi } from "@/api/modules/user";

interface BindUserModalProps {
  open: boolean;
  employee: Employee | null;
  onOk: (userId: number) => Promise<void>;
  onCancel: () => void;
}

interface UserOption {
  id: number;
  username: string;
  display: string;
}

export function BindUserModal({
  open,
  employee,
  onOk,
  onCancel,
}: BindUserModalProps) {
  const [form] = Form.useForm();
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadUsers = useCallback(async (keyword?: string) => {
    setLoadingUsers(true);
    try {
      const users = await userApi.listUsers(keyword);
      setUserOptions(
        users.map((u) => ({
          id: u.id,
          username: u.username,
          display: u.username + (u.email ? ` (${u.email})` : ""),
        })),
      );
    } catch {
      // silent fail
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, loadUsers]);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onOk(values.user_id);
  };

  return (
    <Modal
      title={`绑定账号 - ${employee?.name || ""}`}
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel} data-testid="btn-bind-cancel">
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleOk}
          data-testid="btn-bind-confirm"
        >
          确认
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="user_id"
          label="选择用户"
          rules={[{ required: true, message: "请选择要绑定的用户" }]}
        >
          {loadingUsers ? (
            <Spin size="small" />
          ) : (
            <Select
              showSearch
              filterOption={false}
              placeholder="搜索用户名或邮箱"
              options={userOptions.map((u) => ({
                value: u.id,
                label: u.display,
              }))}
              notFoundContent={
                loadingUsers ? <Spin size="small" /> : "无匹配用户"
              }
              data-testid="sel-bind-user"
            />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}
