import { useEffect, useState } from "react";
import { Table, Button, Space, message, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { userAdminApi, AdminUserItem } from "@/api/modules/userAdmin";
import UserModal from "./UserModal";

const formatDate = (text: string) => text?.split("T")[0] || "-";

export function UserManagementPage() {
  const [data, setData] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await userAdminApi.listUsers(page, pageSize);
      setData(result.items);
      setTotal(result.total);
    } catch {
      message.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleCreate = () => {
    setModalMode("create");
    setEditingUser(null);
    setModalVisible(true);
  };

  const handleEdit = (user: AdminUserItem) => {
    setModalMode("edit");
    setEditingUser(user);
    setModalVisible(true);
  };

  const handleDelete = async (userId: number) => {
    try {
      await userAdminApi.deleteUser(userId);
      message.success("删除成功");
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error?.response?.data?.message || "删除失败");
    }
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    fetchData();
  };

  const columns: ColumnsType<AdminUserItem> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "手机号",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "管理员",
      dataIndex: "is_admin",
      key: "is_admin",
      render: (isAdmin: boolean) => (isAdmin ? "是" : "否"),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      render: formatDate,
    },
    {
      title: "更新时间",
      dataIndex: "updated_at",
      key: "updated_at",
      render: formatDate,
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
            data-testid={`btn-edit-user-${record.id}`}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该用户？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              data-testid={`btn-delete-user-${record.id}`}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>用户管理</h2>
        <Button
          type="primary"
          onClick={handleCreate}
          data-testid="btn-create-user"
        >
          新建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <UserModal
        visible={modalVisible}
        mode={modalMode}
        user={editingUser}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
