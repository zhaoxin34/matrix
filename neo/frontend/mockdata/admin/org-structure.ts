// ============================================================
// Types
// ============================================================
export type OrgUnitType =
  | "company"
  | "branch"
  | "department"
  | "sub_department";
export type OrgUnitStatus = "active" | "inactive";
export type EmployeeStatus =
  | "onboarding"
  | "on_job"
  | "transferring"
  | "offboarding";

export interface OrgUnitTreeNode {
  id: string;
  name: string;
  code: string;
  type: OrgUnitType;
  status: OrgUnitStatus;
  total_member_count: number;
  children: OrgUnitTreeNode[];
}

export interface Employee {
  id: string;
  employee_no: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  primary_unit_id: string;
  status: EmployeeStatus;
}

// ============================================================
// Organization Tree
// ============================================================
export const mockOrgTree: OrgUnitTreeNode[] = [
  {
    id: "1",
    name: "Matrix 公司",
    code: "MATRIX",
    type: "company",
    status: "active",
    total_member_count: 2,
    children: [
      {
        id: "2",
        name: "北京分公司",
        code: "MATRIX-BJ",
        type: "branch",
        status: "active",
        total_member_count: 1,
        children: [
          {
            id: "3",
            name: "技术部",
            code: "MATRIX-BJ-TECH",
            type: "department",
            status: "active",
            total_member_count: 1,
            children: [
              {
                id: "4",
                name: "技术一组",
                code: "MATRIX-BJ-TECH-G1",
                type: "sub_department",
                status: "active",
                total_member_count: 1,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "5",
        name: "测试部门",
        code: "MATRIX-QA",
        type: "department",
        status: "active",
        total_member_count: 0,
        children: [],
      },
    ],
  },
];

// ============================================================
// Employees
// ============================================================
export const mockEmployees: Employee[] = [
  {
    id: "1",
    employee_no: "001",
    name: "张三",
    phone: "13800138001",
    email: "zhangsan@matrix.com",
    position: "高级工程师",
    primary_unit_id: "4",
    status: "on_job",
  },
  {
    id: "2",
    employee_no: "002",
    name: "李四",
    phone: "13800138002",
    email: "lisi@matrix.com",
    position: "技术经理",
    primary_unit_id: "3",
    status: "on_job",
  },
  {
    id: "3",
    employee_no: "003",
    name: "王五",
    phone: "13800138003",
    email: "wangwu@matrix.com",
    position: "测试工程师",
    primary_unit_id: "5",
    status: "onboarding",
  },
  {
    id: "4",
    employee_no: "004",
    name: "赵六",
    phone: "13800138004",
    email: "zhaoliu@matrix.com",
    position: "前端开发",
    primary_unit_id: "4",
    status: "transferring",
  },
  {
    id: "5",
    employee_no: "005",
    name: "钱七",
    phone: "13800138005",
    email: "qianqi@matrix.com",
    position: "后端开发",
    primary_unit_id: "2",
    status: "offboarding",
  },
];

// ============================================================
// Helper functions
// ============================================================
export function countOrgUnits(nodes: OrgUnitTreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children.length > 0) {
      count += countOrgUnits(node.children);
    }
  }
  return count;
}

export function getAllDescendantIds(
  nodes: OrgUnitTreeNode[],
  parentId: string,
): string[] {
  const result: string[] = [];
  const findNode = (nodes: OrgUnitTreeNode[]): OrgUnitTreeNode | null => {
    for (const node of nodes) {
      if (node.id === parentId) return node;
      const found = findNode(node.children);
      if (found) return found;
    }
    return null;
  };
  const node = findNode(nodes);
  if (node) {
    result.push(node.id);
    const collectIds = (n: OrgUnitTreeNode) => {
      for (const child of n.children) {
        result.push(child.id);
        collectIds(child);
      }
    };
    collectIds(node);
  }
  return result;
}
