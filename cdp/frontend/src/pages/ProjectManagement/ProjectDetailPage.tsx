import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Tabs, Table, Space, Tag, Modal, Form, Input, message, Select, Breadcrumb, Popconfirm, Card } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Project, ProjectMember, ProjectMemberCreate, OrgProject } from "@/api/modules/project";
import { projectApi } from "@/api/modules/project";
import type { ColumnsType } from "antd/es/table";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  // Members
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberForm] = Form.useForm();

  // Organizations
  const [orgs, setOrgs] = useState<OrgProject[]>([]);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgForm] = Form.useForm();

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await projectApi.getById(Number(id));
      setProject(p);
    } catch (e) {
      message.error("获取项目信息失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!id) return;
    try {
      const res = await projectApi.listMembers(Number(id));
      setMembers(res.items);
    } catch (e) {
      message.error("获取成员列表失败");
    }
  };

  const fetchOrgs = async () => {
    if (!id) return;
    try {
      const res = await projectApi.listOrganizations(Number(id));
      setOrgs(res.items);
    } catch (e) {
      message.error("获取组织关联失败");
    }
  };

  useEffect(() => {
    fetchProject();
    fetchMembers();
    fetchOrgs();
  }, [id]);

  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      await projectApi.addMember(Number(id), values as ProjectMemberCreate);
      message.success("添加成员成功");
      setMemberModalOpen(false);
      memberForm.resetFields();
      fetchMembers();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      message.error(err?.response?.data?.detail || "添加成员失败");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await projectApi.removeMember(Number(id), userId);
      message.success("移除成员成功");
      fetchMembers();
    } catch (e) {
      message.error("移除成员失败");
    }
  };

  const handleUpdateMemberRole = async (userId: number, role: "admin" | "member") => {
    try {
      await projectApi.updateMemberRole(Number(id), userId, role);
      message.success("更新角色成功");
      fetchMembers();
    } catch (e) {
      message.error("更新角色失败");
    }
  };

  const handleAddOrg = async () => {
    try {
      const values = await orgForm.validateFields();
      await projectApi.associateOrg(Number(id), values.org_id);
      message.success("关联组织成功");
      setOrgModalOpen(false);
      orgForm.resetFields();
      fetchOrgs();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      message.error(err?.response?.data?.detail || "关联组织失败");
    }
  };

  const handleRemoveOrg = async (orgId: number) => {
    try {
      await projectApi.disassociateOrg(Number(id), orgId);
      message.success("取消关联成功");
      fetchOrgs();
    } catch (e) {
      message.error("取消关联失败");
    }
  };

  const memberColumns: ColumnsType<ProjectMember> = [
    {
      title: "用户ID",
      dataIndex: "user_id",
      key: "user_id",
      width: 100,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "blue" : "default"}>{role}</Tag>
      ),
    },
    {
      title: "加入时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space>
          <Select
            value={record.role}
            onChange={(value) => handleUpdateMemberRole(record.user_id, value)}
            options={[
              { value: "admin", label: "管理员" },
              { value: "member", label: "成员" },
            ]}
            size="small"
          />
          <Popconfirm
            title="确认移除？"
            onConfirm={() => handleRemoveMember(record.user_id)}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const orgColumns: ColumnsType<OrgProject> = [
    {
      title: "组织ID",
      dataIndex: "org_id",
      key: "org_id",
      width: 100,
    },
    {
      title: "组织名称",
      key: "org_name",
      render: (_, record) => record.organization?.name || `-`,
    },
    {
      title: "关联时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="确认取消关联？"
          onConfirm={() => handleRemoveOrg(record.org_id)}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    {
      key: "members",
      label: "成员管理",
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setMemberModalOpen(true)}
              data-testid="btn-add-member"
            >
              添加成员
            </Button>
          </div>
          <Table
            columns={memberColumns}
            dataSource={members}
            rowKey="id"
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: "organizations",
      label: "组织关联",
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOrgModalOpen(true)}
              data-testid="btn-add-org"
            >
              关联组织
            </Button>
          </div>
          <Table
            columns={orgColumns}
            dataSource={orgs}
            rowKey="id"
            pagination={false}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate("/projects")}>项目管理</a> },
          { title: project?.name || "加载中..." },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Card loading={loading}>
        <div style={{ marginBottom: 16 }}>
          <h2>{project?.name}</h2>
          <Space>
            <Tag color={project?.status === "active" ? "green" : "orange"}>{project?.status}</Tag>
            <span>代码: {project?.code}</span>
          </Space>
        </div>
      </Card>

      <Tabs defaultActiveKey="members" items={tabItems} style={{ marginTop: 16 }} />

      <Modal
        title="添加成员"
        open={memberModalOpen}
        onOk={handleAddMember}
        onCancel={() => {
          setMemberModalOpen(false);
          memberForm.resetFields();
        }}
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item
            name="user_id"
            label="用户ID"
            rules={[{ required: true, message: "请输入用户ID" }]}
          >
            <Input type="number" placeholder="请输入用户ID" data-testid="inp-member-user-id" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="member">
            <Select
              options={[
                { value: "admin", label: "管理员" },
                { value: "member", label: "成员" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关联组织"
        open={orgModalOpen}
        onOk={handleAddOrg}
        onCancel={() => {
          setOrgModalOpen(false);
          orgForm.resetFields();
        }}
      >
        <Form form={orgForm} layout="vertical">
          <Form.Item
            name="org_id"
            label="组织ID"
            rules={[{ required: true, message: "请输入组织ID" }]}
          >
            <Input type="number" placeholder="请输入组织ID" data-testid="inp-org-id" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}