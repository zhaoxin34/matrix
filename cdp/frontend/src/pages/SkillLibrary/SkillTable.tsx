import { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  Input,
  Select,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Skill, SkillLevel } from "@/types/skill";
import { skillApi } from "@/api/modules/skill";

interface SkillTableProps {
  onAdd: () => void;
  onEdit: (skill: Skill) => void;
  onView: (skill: Skill) => void;
  refreshKey?: number;
}

const LEVEL_OPTIONS = [
  { value: "Planning", label: "Planning" },
  { value: "Functional", label: "Functional" },
  { value: "Atomic", label: "Atomic" },
];

const LEVEL_COLOR: Record<SkillLevel, string> = {
  Planning: "blue",
  Functional: "green",
  Atomic: "orange",
};

export function SkillTable({
  onAdd,
  onEdit,
  onView,
  refreshKey,
}: SkillTableProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState<SkillLevel | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const result = await skillApi.list({
        level: levelFilter,
        is_active: statusFilter,
        keyword: keyword || undefined,
        page,
        page_size: pageSize,
      });
      setSkills(result.items);
      setTotal(result.total);
    } catch {
      message.error("加载技能列表失败");
    } finally {
      setLoading(false);
    }
  }, [levelFilter, statusFilter, keyword, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [levelFilter, statusFilter, keyword, refreshKey]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills, refreshKey]);

  const handleActivate = async (skill: Skill) => {
    try {
      await skillApi.activate(skill.code);
      message.success("技能已启用");
      loadSkills();
    } catch {
      message.error("启用失败");
    }
  };

  const handleDeactivate = async (skill: Skill) => {
    try {
      await skillApi.deactivate(skill.code);
      message.success("技能已禁用");
      loadSkills();
    } catch {
      message.error("禁用失败");
    }
  };

  const handleDelete = async (skill: Skill) => {
    try {
      await skillApi.delete(skill.code);
      message.success("删除成功");
      loadSkills();
    } catch {
      message.error("删除失败");
    }
  };

  const columns: ColumnsType<Skill> = [
    { title: "技能代码", dataIndex: "code", width: 150 },
    { title: "技能名称", dataIndex: "name", width: 180 },
    {
      title: "级别",
      dataIndex: "level",
      width: 100,
      render: (level: SkillLevel) => (
        <Tag color={LEVEL_COLOR[level]}>{level}</Tag>
      ),
    },
    {
      title: "标签",
      dataIndex: "tags",
      width: 150,
      render: (tags: string[] | null) =>
        tags && tags.length > 0 ? (
          <span>
            {tags.slice(0, 3).map((tag) => (
              <Tag key={tag} style={{ marginRight: 4 }}>
                {tag}
              </Tag>
            ))}
            {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
          </span>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
    { title: "作者", dataIndex: "author", width: 100 },
    {
      title: "状态",
      dataIndex: "is_active",
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "启用" : "禁用"}
        </Tag>
      ),
    },
    { title: "创建时间", dataIndex: "created_at", width: 160 },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, skill) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(skill)}
              data-testid={`btn-skill-view-${skill.code}`}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(skill)}
              data-testid={`btn-skill-edit-${skill.code}`}
            />
          </Tooltip>
          {skill.is_active ? (
            <Tooltip title="禁用">
              <Popconfirm
                title="确认禁用该技能？"
                onConfirm={() => handleDeactivate(skill)}
              >
                <Button
                  type="link"
                  size="small"
                  icon={<StopOutlined />}
                  danger
                  data-testid={`btn-skill-deactivate-${skill.code}`}
                />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="启用">
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleActivate(skill)}
                data-testid={`btn-skill-activate-${skill.code}`}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确认删除该技能？"
              onConfirm={() => handleDelete(skill)}
            >
              <Button
                type="link"
                size="small"
                icon={<DeleteOutlined />}
                danger
                data-testid={`btn-skill-delete-${skill.code}`}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Input.Search
          placeholder="搜索技能代码/名称"
          allowClear
          style={{ width: 200 }}
          onSearch={setKeyword}
          data-testid="inp-skill-search"
        />
        <Select
          allowClear
          placeholder="级别筛选"
          style={{ width: 120 }}
          options={LEVEL_OPTIONS}
          onChange={setLevelFilter}
          data-testid="sel-skill-level"
        />
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 100 }}
          options={[
            { value: true, label: "启用" },
            { value: false, label: "禁用" },
          ]}
          onChange={(val) => setStatusFilter(val)}
          data-testid="sel-skill-status"
        />
        <div style={{ marginLeft: "auto" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
            data-testid="btn-skill-add"
          >
            新增技能
          </Button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Table
          columns={columns}
          dataSource={skills}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>
    </div>
  );
}
