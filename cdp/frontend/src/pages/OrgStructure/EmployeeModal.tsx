import { useEffect, useState, useCallback } from "react";
import { Modal, Form, Input, DatePicker, Button, TreeSelect, Spin } from "antd";
import dayjs from "dayjs";
import type {
  Employee,
  EmployeeCreate,
  EmployeeUpdate,
  OrgUnitTreeNode,
} from "@/types/org";
import { orgUnitApi } from "@/api/modules/orgUnit";

interface EmployeeModalProps {
  open: boolean;
  mode: "create" | "edit";
  editingEmployee?: Employee | null;
  defaultUnitId?: number | null;
  onOk: (data: EmployeeCreate | EmployeeUpdate) => Promise<void>;
  onCancel: () => void;
}

export function EmployeeModal({
  open,
  mode,
  editingEmployee,
  defaultUnitId,
  onOk,
  onCancel,
}: EmployeeModalProps) {
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
      if (mode === "edit" && editingEmployee) {
        form.setFieldsValue({
          employee_no: editingEmployee.employee_no,
          name: editingEmployee.name,
          phone: editingEmployee.phone,
          email: editingEmployee.email,
          position: editingEmployee.position,
          primary_unit_id: editingEmployee.primary_unit_id,
          entry_date: editingEmployee.entry_date
            ? dayjs(editingEmployee.entry_date)
            : null,
        });
      } else {
        form.resetFields();
        if (defaultUnitId) {
          form.setFieldValue("primary_unit_id", defaultUnitId);
        }
      }
    }
  }, [open, mode, editingEmployee, defaultUnitId, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      entry_date: values.entry_date
        ? values.entry_date.format("YYYY-MM-DD")
        : null,
    };
    await onOk(data);
  };

  return (
    <Modal
      title={mode === "create" ? "新增员工" : "编辑员工"}
      open={open}
      onCancel={onCancel}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel} data-testid="btn-emp-cancel">
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleOk}
          data-testid="btn-emp-confirm"
        >
          确认
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {mode === "create" && (
          <Form.Item
            name="employee_no"
            label="工号"
            rules={[{ required: true, message: "请输入工号" }]}
          >
            <Input placeholder="请输入工号" data-testid="inp-emp-no" />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: "请输入姓名" }]}
        >
          <Input placeholder="请输入姓名" data-testid="inp-emp-name" />
        </Form.Item>
        <Form.Item name="phone" label="电话">
          <Input placeholder="请输入电话" data-testid="inp-emp-phone" />
        </Form.Item>
        <Form.Item name="email" label="邮箱">
          <Input placeholder="请输入邮箱" data-testid="inp-emp-email" />
        </Form.Item>
        <Form.Item name="position" label="职位">
          <Input placeholder="请输入职位" data-testid="inp-emp-position" />
        </Form.Item>
        <Form.Item name="primary_unit_id" label="主部门">
          {loadingDepts ? (
            <Spin size="small" />
          ) : (
            <TreeSelect
              style={{ width: "100%" }}
              placeholder="请选择部门"
              treeData={departmentOptions}
              fieldNames={{ label: "name", value: "id", children: "children" }}
              allowClear
              showSearch
              treeNodeFilterProp="name"
              treeDefaultExpandAll
              data-testid="ts-emp-dept"
            />
          )}
        </Form.Item>
        <Form.Item name="entry_date" label="入职日期">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
