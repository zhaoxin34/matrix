// ============================================================
// Types
// ============================================================
export interface User {
  id: string;
  username: string;
  phone: string;
  email: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UserFormData {
  username: string;
  phone: string;
  email: string;
}

// ============================================================
// Users List
// ============================================================
export const mockUsers: User[] = [
  {
    id: "1",
    username: "张三",
    phone: "13800138001",
    email: "zhang@qq.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-01-15 10:30",
  },
  {
    id: "2",
    username: "李四",
    phone: "13800138002",
    email: "li@qq.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-02-20 14:22",
  },
  {
    id: "3",
    username: "王五",
    phone: "13800138003",
    email: "wang@163.com",
    isSuperAdmin: false,
    isActive: false,
    createdAt: "2026-03-05 09:15",
  },
  {
    id: "4",
    username: "赵六",
    phone: "13800138004",
    email: "zhao@gmail.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-03-10 16:45",
  },
  {
    id: "5",
    username: "系统管理员",
    phone: "13800138000",
    email: "admin@neo.com",
    isSuperAdmin: true,
    isActive: true,
    createdAt: "2025-12-01 00:00",
  },
  {
    id: "6",
    username: "孙七",
    phone: "13800138005",
    email: "sun@126.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-04-02 11:20",
  },
  {
    id: "7",
    username: "周八",
    phone: "13800138006",
    email: "zhou@yahoo.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-04-15 08:30",
  },
  {
    id: "8",
    username: "吴九",
    phone: "13800138007",
    email: "wu@outlook.com",
    isSuperAdmin: false,
    isActive: false,
    createdAt: "2026-04-20 13:55",
  },
];
