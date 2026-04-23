import { useEffect, useState } from "react";
import { Modal, Input, Typography, Space } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

interface DeleteConfirmModalProps {
  open: boolean;
  unitName: string;
  onOk: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  open,
  unitName,
  onOk,
  onCancel,
}: DeleteConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  const isMatch = inputValue === unitName;

  return (
    <Modal
      open={open}
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
          <span>确认删除组织</span>
        </Space>
      }
      onOk={onOk}
      onCancel={onCancel}
      okText="确认删除"
      okButtonProps={{
        danger: true,
        disabled: !isMatch,
        "data-testid": "btn-delete-confirm",
      }}
      cancelButtonProps={{
        "data-testid": "btn-delete-cancel",
      }}
      data-testid="modal-delete-confirm"
    >
      <div style={{ marginBottom: 16 }}>
        <Paragraph>
          删除组织将同时删除其所有子组织，且<span style={{ color: "#ff4d4f", fontWeight: 500 }}>不可恢复</span>。
        </Paragraph>
        <Paragraph>请输入以下组织名称以确认删除：</Paragraph>
      </div>

      <div
        style={{
          background: "#f5f5f5",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Text strong>{unitName}</Text>
      </div>

      <Input
        placeholder={`请输入 "${unitName}" 确认删除`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        status={inputValue && !isMatch ? "error" : undefined}
        data-testid="inp-delete-confirm-name"
      />

      {inputValue && !isMatch && (
        <Text type="danger" style={{ marginTop: 8, display: "block" }}>
          名称不匹配，请重新输入
        </Text>
      )}
    </Modal>
  );
}
