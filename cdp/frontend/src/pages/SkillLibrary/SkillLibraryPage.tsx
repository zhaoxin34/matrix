import { useState } from "react";
import { message } from "antd";
import type { Skill, SkillCreate, SkillUpdate } from "@/types/skill";
import { skillApi } from "@/api/modules/skill";
import { SkillTable } from "./SkillTable";
import { SkillModal } from "./SkillModal";
import { SkillDetailDrawer } from "./SkillDetailDrawer";

export function SkillLibraryPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Detail drawer state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSkillCode, setDetailSkillCode] = useState<string | null>(null);

  const handleAdd = () => {
    setModalMode("create");
    setEditingSkill(null);
    setModalOpen(true);
  };

  const handleEdit = (skill: Skill) => {
    setModalMode("edit");
    setEditingSkill(skill);
    setModalOpen(true);
  };

  const handleView = (skill: Skill) => {
    setDetailSkillCode(skill.code);
    setDetailOpen(true);
  };

  const handleModalOk = async (data: SkillCreate | SkillUpdate) => {
    try {
      if (modalMode === "create") {
        await createSkill(data as SkillCreate);
      } else {
        await updateSkill(data as SkillUpdate);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      message.error(err?.response?.data?.detail || "操作失败");
    }
  };

  const createSkill = async (data: SkillCreate) => {
    await skillApi.create(data);
    message.success("创建成功");
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const updateSkill = async (data: SkillUpdate) => {
    await skillApi.update(editingSkill!.code, data);
    message.success("更新成功");
    setModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div
      style={{
        padding: 24,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          marginBottom: 16,
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        技能库
      </div>
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <SkillTable
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          refreshKey={refreshKey}
        />
      </div>

      <SkillModal
        open={modalOpen}
        mode={modalMode}
        editingSkill={editingSkill}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
      />

      <SkillDetailDrawer
        open={detailOpen}
        skillCode={detailSkillCode}
        onClose={() => {
          setDetailOpen(false);
          setDetailSkillCode(null);
        }}
      />
    </div>
  );
}
