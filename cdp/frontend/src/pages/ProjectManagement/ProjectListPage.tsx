import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Switch,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
} from "@/api/modules/project";
import { projectApi } from "@/api/modules/project";
import type { ColumnsType } from "antd/es/table";

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.list({ page, page_size: pageSize });
      setProjects(res.items);
      setTotal(res.total);
    } catch {
      message.error("获取项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]); // 只在分页改变时重新获取

  const handleAdd = () => {
    setModalMode("create");
    setEditingProject(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setModalMode("edit");
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      code: project.code,
      description: project.description,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (project: Project) => {
    try {
      const newStatus = project.status === "active" ? "inactive" : "active";
      await projectApi.update(project.id, { status: newStatus });
      message.success(newStatus === "active" ? "启用成功" : "禁用成功");
      fetchProjects();
    } catch {
      message.error("操作失败");
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      await projectApi.update(project.id, { status: "archived" });
      message.success("归档成功");
      fetchProjects();
    } catch {
      message.error("归档失败");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === "create") {
        await projectApi.create(values as ProjectCreate);
        message.success("创建成功");
      } else {
        await projectApi.update(editingProject!.id, values as ProjectUpdate);
        message.success("更新成功");
      }
      setModalOpen(false);
      fetchProjects();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      message.error(err?.response?.data?.detail || "操作失败");
    }
  };

  const columns: ColumnsType<Project> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "项目名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "项目代码",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "active"
            ? "green"
            : status === "inactive"
              ? "orange"
              : "gray";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`btn-edit-project-${record.id}`}
          />
          <Tooltip
            title={record.status === "archived" ? "已归档项目无法操作" : ""}
          >
            <Switch
              checked={record.status === "active"}
              disabled={record.status === "archived"}
              onChange={() => handleToggleStatus(record)}
              data-testid={`switch-status-project-${record.id}`}
            />
          </Tooltip>
          <Tooltip
            title={
              record.status !== "inactive" ? "仅禁用状态可归档" : "归档项目"
            }
          >
            <Button
              type="text"
              icon={<InboxOutlined />}
              disabled={record.status !== "inactive"}
              onClick={() => handleArchive(record)}
              data-testid={`btn-archive-project-${record.id}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: 24,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 16, fontSize: 20, fontWeight: "bold" }}>
        项目管理
      </div>

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Input
            placeholder="搜索项目名称或代码"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          data-testid="btn-add-project"
        >
          新建项目
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={modalMode === "create" ? "新建项目" : "编辑项目"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: "请输入项目名称" }]}
          >
            <Input
              placeholder="请输入项目名称"
              data-testid="inp-project-name"
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="项目代码"
            rules={[{ required: true, message: "请输入项目代码" }]}
          >
            <Input
              placeholder="请输入项目代码（唯一）"
              disabled={modalMode === "edit"}
              data-testid="inp-project-code"
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea
              placeholder="请输入描述"
              rows={3}
              data-testid="inp-project-description"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
