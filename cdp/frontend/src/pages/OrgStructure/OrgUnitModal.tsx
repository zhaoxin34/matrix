import { useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, Button } from "antd";
import type {
  OrgUnit,
  OrgUnitCreate,
  OrgUnitTreeNode,
  OrgUnitUpdate,
} from "@/types/org";

interface OrgUnitModalProps {
  open: boolean;
  mode: "create" | "edit";
  parentId?: number | null;
  editingUnit?: OrgUnitTreeNode | OrgUnit | null;
  onOk: (data: OrgUnitCreate | OrgUnitUpdate) => Promise<void>;
  onCancel: () => void;
}

const ORG_TYPE_OPTIONS = [
  { value: "company", label: "公司" },
  { value: "branch", label: "分支机构" },
  { value: "department", label: "部门" },
  { value: "sub_department", label: "子部门" },
];

export function OrgUnitModal({
  open,
  mode,
  parentId,
  editingUnit,
  onOk,
  onCancel,
}: OrgUnitModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (mode === "edit" && editingUnit) {
        form.setFieldsValue({
          name: editingUnit.name,
          code: editingUnit.code,
          type: editingUnit.type,
          sort_order: editingUnit.sort_order,
        });
      } else {
        form.resetFields();
        if (parentId !== undefined) {
          form.setFieldValue("parent_id", parentId);
        }
      }
    }
  }, [open, mode, editingUnit, parentId, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onOk(values);
  };

  return (
    <Modal
      title={mode === "create" ? "新增组织单元" : "编辑组织单元"}
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel} data-testid="btn-org-cancel">
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleOk}
          data-testid="btn-org-confirm"
        >
          确认
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: "请输入名称" }]}
        >
          <Input placeholder="请输入组织名称" data-testid="inp-org-name" />
        </Form.Item>
        <Form.Item
          name="code"
          label="编码"
          rules={[{ required: true, message: "请输入编码" }]}
        >
          <Input placeholder="请输入唯一编码" data-testid="inp-org-code" />
        </Form.Item>
        {mode === "create" && (
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select
              options={ORG_TYPE_OPTIONS}
              placeholder="请选择组织类型"
              data-testid="sel-org-type"
            />
          </Form.Item>
        )}
        <Form.Item name="sort_order" label="排序">
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder="0"
            data-testid="inp-org-sort"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
