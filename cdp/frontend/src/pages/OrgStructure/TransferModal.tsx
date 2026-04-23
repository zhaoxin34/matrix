import { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  TreeSelect,
  Spin,
} from "antd";
import type {
  Employee,
  EmployeeTransferCreate,
  OrgUnitTreeNode,
} from "@/types/org";
import { orgUnitApi } from "@/api/modules/orgUnit";

interface TransferModalProps {
  open: boolean;
  employee: Employee | null;
  onOk: (data: EmployeeTransferCreate) => Promise<void>;
  onCancel: () => void;
}

const TRANSFER_TYPE_OPTIONS = [
  { value: "promotion", label: "晋升" },
  { value: "demotion", label: "降职" },
  { value: "transfer", label: "平调" },
];

export function TransferModal({
  open,
  employee,
  onOk,
  onCancel,
}: TransferModalProps) {
  const [form] = Form.useForm();
  const [departmentOptions, setDepartmentOptions] = useState<OrgUnitTreeNode[]>(
    [],
  );
  const [loadingDepts, setLoadingDepts] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const data = await orgUnitApi.getTree();
      setDepartmentOptions(data);
    } catch {
      // silent fail
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open, loadDepartments]);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const data: EmployeeTransferCreate = {
      to_unit_id: values.to_unit_id,
      transfer_type: values.transfer_type,
      effective_date: values.effective_date.format("YYYY-MM-DD"),
      reason: values.reason || null,
    };
    await onOk(data);
  };

  return (
    <Modal
      title={`发起调动 - ${employee?.name || ""}`}
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          data-testid="btn-transfer-cancel"
        >
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleOk}
          data-testid="btn-transfer-confirm"
        >
          确认
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="to_unit_id"
          label="目标部门"
          rules={[{ required: true, message: "请选择目标部门" }]}
        >
          {loadingDepts ? (
            <Spin size="small" />
          ) : (
            <TreeSelect
              style={{ width: "100%" }}
              placeholder="请选择目标部门"
              treeData={departmentOptions}
              fieldNames={{ label: "name", value: "id", children: "children" }}
              allowClear
              showSearch
              treeNodeFilterProp="name"
              treeDefaultExpandAll
              data-testid="ts-transfer-to-unit"
            />
          )}
        </Form.Item>
        <Form.Item
          name="transfer_type"
          label="调动类型"
          rules={[{ required: true, message: "请选择调动类型" }]}
        >
          <Select
            options={TRANSFER_TYPE_OPTIONS}
            placeholder="请选择"
            data-testid="sel-transfer-type"
          />
        </Form.Item>
        <Form.Item
          name="effective_date"
          label="生效日期"
          rules={[{ required: true, message: "请选择生效日期" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            data-testid="dp-transfer-effective-date"
          />
        </Form.Item>
        <Form.Item name="reason" label="调动原因">
          <Input.TextArea
            rows={3}
            placeholder="请输入调动原因（可选）"
            data-testid="txt-transfer-reason"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
