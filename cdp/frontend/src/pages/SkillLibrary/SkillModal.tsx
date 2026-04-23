import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button } from "antd";
import type { Skill, SkillCreate, SkillUpdate } from "@/types/skill";

interface SkillModalProps {
  open: boolean;
  mode: "create" | "edit";
  editingSkill?: Skill | null;
  onOk: (data: SkillCreate | SkillUpdate) => Promise<void>;
  onCancel: () => void;
}

const LEVEL_OPTIONS = [
  { value: "Planning", label: "Planning" },
  { value: "Functional", label: "Functional" },
  { value: "Atomic", label: "Atomic" },
];

export function SkillModal({
  open,
  mode,
  editingSkill,
  onOk,
  onCancel,
}: SkillModalProps) {
  const [form] = Form.useForm();
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && editingSkill) {
        form.setFieldsValue({
          name: editingSkill.name,
          level: editingSkill.level,
          author: editingSkill.author,
          content: editingSkill.content,
        });
        setTagsInput(editingSkill.tags?.join(", ") || "");
      } else {
        form.resetFields();
        setTagsInput("");
      }
    }
  }, [open, mode, editingSkill, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const data = {
        ...values,
        tags: tagsInput
          ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
      };
      await onOk(data as SkillCreate | SkillUpdate);
    } catch {
      // validation failed, do nothing
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={mode === "create" ? "新增技能" : "编辑技能"}
      open={open}
      onCancel={onCancel}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleOk}
          loading={submitting}
          data-testid="btn-skill-modal-confirm"
        >
          确认
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {mode === "create" && (
          <Form.Item
            name="code"
            label="技能代码"
            rules={[
              { required: true, message: "请输入技能代码" },
              { pattern: /^[a-zA-Z0-9-]{4,64}$/, message: "代码只能包含字母、数字和连字符，长度4-64" },
            ]}
          >
            <Input
              placeholder="请输入技能代码，如 my-skill-1"
              data-testid="inp-skill-code"
            />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          label="技能名称"
          rules={[{ required: true, message: "请输入技能名称" }]}
        >
          <Input placeholder="请输入技能名称" data-testid="inp-skill-name" />
        </Form.Item>
        <Form.Item
          name="level"
          label="技能级别"
          rules={[{ required: true, message: "请选择技能级别" }]}
        >
          <Select
            placeholder="请选择级别"
            options={LEVEL_OPTIONS}
            data-testid="sel-skill-level"
          />
        </Form.Item>
        <Form.Item label="标签">
          <Input
            placeholder="多个标签用逗号分隔，如 tag1, tag2"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            data-testid="inp-skill-tags"
          />
        </Form.Item>
        <Form.Item name="author" label="作者">
          <Input placeholder="请输入作者" data-testid="inp-skill-author" />
        </Form.Item>
        <Form.Item
          name="content"
          label="技能内容"
          rules={[{ required: true, message: "请输入技能内容" }]}
        >
          <Input.TextArea
            placeholder="请输入技能内容（支持 Markdown）"
            rows={6}
            data-testid="txta-skill-content"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}