import { Drawer, Tag, Spin, Descriptions } from "antd";
import { useEffect, useState } from "react";
import type { Skill } from "@/types/skill";
import { skillApi } from "@/api/modules/skill";

interface SkillDetailDrawerProps {
  open: boolean;
  skillCode: string | null;
  onClose: () => void;
}

const LEVEL_COLOR: Record<string, string> = {
  Planning: "blue",
  Functional: "green",
  Atomic: "orange",
};

export function SkillDetailDrawer({
  open,
  skillCode,
  onClose,
}: SkillDetailDrawerProps) {
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && skillCode) {
      setLoading(true);
      skillApi
        .getByCode(skillCode)
        .then((data) => setSkill(data))
        .catch(() => setSkill(null))
        .finally(() => setLoading(false));
    } else {
      setSkill(null);
    }
  }, [open, skillCode]);

  return (
    <Drawer
      title="技能详情"
      placement="right"
      width={600}
      open={open}
      onClose={onClose}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : skill ? (
        <div>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="技能代码">{skill.code}</Descriptions.Item>
            <Descriptions.Item label="技能名称">{skill.name}</Descriptions.Item>
            <Descriptions.Item label="级别">
              <Tag color={LEVEL_COLOR[skill.level]}>{skill.level}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="作者">
              {skill.author || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={skill.is_active ? "success" : "default"}>
                {skill.is_active ? "启用" : "禁用"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="标签">
              {skill.tags && skill.tags.length > 0
                ? skill.tags.map((tag) => (
                    <Tag key={tag} style={{ marginRight: 4 }}>
                      {tag}
                    </Tag>
                  ))
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {skill.created_at}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {skill.updated_at}
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>技能内容</h4>
            <div
              style={{
                padding: 12,
                background: "#f5f5f5",
                borderRadius: 4,
                whiteSpace: "pre-wrap",
                minHeight: 100,
              }}
            >
              {skill.content}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
          未找到技能信息
        </div>
      )}
    </Drawer>
  );
}
