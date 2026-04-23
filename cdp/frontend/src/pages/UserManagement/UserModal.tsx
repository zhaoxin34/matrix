import { useEffect } from "react";
import { Modal, Form, Input, Switch, message } from "antd";
import { userAdminApi, CreateUserData, UpdateUserData } from "@/api/modules/userAdmin";
import type { AdminUserItem } from "@/api/modules/userAdmin";

export interface UserModalProps {
  visible: boolean;
  mode: "create" | "edit";
  user: AdminUserItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserModal({ visible, mode, user, onClose, onSuccess }: UserModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && user && mode === "edit") {
      form.setFieldsValue({
        username: user.username,
        phone: user.phone,
        email: user.email,
        is_admin: user.is_admin,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, user, mode, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (mode === "create") {
        const data: CreateUserData = {
          username: values.username,
          phone: values.phone,
          email: values.email,
          password: values.password,
          is_admin: values.is_admin || false,
        };
        await userAdminApi.createUser(data);
        message.success("创建成功");
      } else {
        const data: UpdateUserData = {
          username: values.username,
          phone: values.phone,
          email: values.email,
          is_admin: values.is_admin || false,
        };
        await userAdminApi.updateUser(user!.id, data);
        message.success("更新成功");
      }

      onSuccess();
    } catch (err: unknown) {
      const error = err as { errorFields?: unknown[]; response?: { data?: { message?: string } } };
      if (error.errorFields) {
        return; // Form validation error
      }
      message.error(error?.response?.data?.message || "操作失败");
    }
  };

  return (
    <Modal
      title={mode === "create" ? "新建用户" : "编辑用户"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText={mode === "create" ? "创建" : "保存"}
      cancelText="取消"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: "请输入用户名" },
            { min: 2, max: 50, message: "用户名长度为2-50个字符" },
          ]}
        >
          <Input placeholder="请输入用户名" data-testid="inp-user-username" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: "请输入手机号" },
            { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" },
          ]}
        >
          <Input placeholder="请输入手机号" data-testid="inp-user-phone" />
        </Form.Item>

        <Form.Item name="email" label="邮箱">
          <Input placeholder="请输入邮箱（可选）" data-testid="inp-user-email" />
        </Form.Item>

        {mode === "create" && (
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 8, message: "密码至少8个字符" },
            ]}
          >
            <Input.Password placeholder="请输入密码" data-testid="inp-user-password" />
          </Form.Item>
        )}

        <Form.Item name="is_admin" label="管理员" valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
