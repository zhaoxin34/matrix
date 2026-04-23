import { useState } from "react";
import {
  Table,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Avatar,
} from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface CustomerItem {
  key: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
}

const mockCustomers: CustomerItem[] = [
  {
    key: "1",
    id: "C001",
    name: "张三",
    phone: "13800138001",
    email: "zhangsan@example.com",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    key: "2",
    id: "C002",
    name: "李四",
    phone: "13800138002",
    email: "lisi@example.com",
    status: "active",
    createdAt: "2024-01-16",
  },
  {
    key: "3",
    id: "C003",
    name: "王五",
    phone: "13800138003",
    email: "wangwu@example.com",
    status: "inactive",
    createdAt: "2024-01-17",
  },
  {
    key: "4",
    id: "C004",
    name: "赵六",
    phone: "13800138004",
    email: "zhaoliu@example.com",
    status: "active",
    createdAt: "2024-01-18",
  },
];

export function Customer() {
  const [searchText, setSearchText] = useState("");
  const [customers, setCustomers] = useState<CustomerItem[]>(mockCustomers);

  const handleSearch = () => {
    if (!searchText.trim()) {
      setCustomers(mockCustomers);
      return;
    }
    const filtered = mockCustomers.filter(
      (c) =>
        c.name.includes(searchText) ||
        c.phone.includes(searchText) ||
        c.email.includes(searchText),
    );
    setCustomers(filtered);
  };

  const columns = [
    {
      title: "客户信息",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: CustomerItem) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{name}</div>
            <div style={{ fontSize: 12, color: "#999" }}>{record.id}</div>
          </div>
        </Space>
      ),
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
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: "active" | "inactive") => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "活跃" : "不活跃"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        data-testid="card-customer-list"
        title={<Title level={3}>客户管理</Title>}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="搜索客户姓名、手机号或邮箱"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
              data-testid="inp-customer-search"
            />
            <Button
              type="primary"
              onClick={handleSearch}
              data-testid="btn-customer-search"
            >
              搜索
            </Button>
          </Space>
        </div>
        <Table
          data-testid="table-customer-list"
          columns={columns}
          dataSource={customers}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            type: "radio",
            onChange: (selectedRowKeys) => {
              console.log("selected:", selectedRowKeys);
            },
          }}
          onRow={(record) => ({
            "data-testid": "row-customer-first",
            style: { cursor: "pointer" },
            onClick: () => {
              // TODO: 打开客户详情面板
              console.log("clicked customer:", record);
            },
          })}
        />
      </Card>
    </div>
  );
}
