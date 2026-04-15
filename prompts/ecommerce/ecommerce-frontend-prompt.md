# 电商网站前端项目提示词

## 项目概述

本项目为电商网站的前端应用，基于 React + TypeScript + Vite 构建，采用前后端分离架构。

## 技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | React 19 | 最新 React 特性 |
| 构建工具 | Vite | 快速开发体验 |
| 语言 | TypeScript 5 | 类型安全 |
| UI 库 | Ant Design 5 | 企业级 UI |
| 路由 | React Router 6 | SPA 路由 |
| 状态管理 | Zustand | 轻量状态管理 |
| HTTP 客户端 | Axios | API 调用 |
| 表单 | React Hook Form + Zod | 高性能表单 |
| 图表 | Recharts | 数据可视化 |

## 项目结构

```
frontend/
├── src/
│   ├── api/                  # API 客户端封装
│   │   ├── axios.ts          # Axios 实例配置
│   │   ├── modules/          # 按模块组织的 API
│   │   │   ├── product.ts   # 商品模块
│   │   │   ├── order.ts     # 订单模块
│   │   │   ├── user.ts      # 用户模块
│   │   │   └── cart.ts      # 购物车模块
│   │   └── types.ts         # API 响应类型
│   ├── components/           # 公共组件
│   │   ├── common/          # 通用组件（Button, Input, Modal...）
│   │   ├── layout/          # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── product/         # 商品组件
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── ProductDetail.tsx
│   │   ├── cart/            # 购物车组件
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   └── order/           # 订单组件
│   │       ├── OrderForm.tsx
│   │       └── OrderList.tsx
│   ├── pages/               # 页面组件
│   │   ├── Home.tsx         # 首页
│   │   ├── ProductList.tsx  # 商品列表
│   │   ├── ProductDetail.tsx # 商品详情
│   │   ├── Cart.tsx         # 购物车
│   │   ├── Checkout.tsx     # 结账
│   │   ├── Login.tsx        # 登录
│   │   ├── Register.tsx     # 注册
│   │   ├── UserProfile.tsx  # 用户中心
│   │   └── OrderList.tsx    # 订单列表
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useProduct.ts
│   │   ├── useCart.ts
│   │   ├── useAuth.ts
│   │   └── useAsync.ts
│   ├── stores/              # Zustand 状态管理
│   │   ├── authStore.ts     # 认证状态
│   │   ├── cartStore.ts     # 购物车状态
│   │   └── uiStore.ts       # UI 状态
│   ├── utils/               # 工具函数
│   │   ├── format.ts        # 格式化工具
│   │   ├── validation.ts    # 验证工具
│   │   └── storage.ts       # 本地存储
│   ├── types/               # TypeScript 类型定义
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── styles/              # 全局样式
│   │   ├── variables.less   # CSS 变量
│   │   └── global.less
│   ├── App.tsx              # 根组件
│   └── main.tsx             # 入口文件
├── public/                  # 静态资源
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 分层架构

### 1. API 层 (`api/`)

**职责**: 统一管理所有后端 API 调用

```
API 层设计原则：
├── axios.ts          # Axios 实例（拦截器、超时、baseURL）
├── modules/          # 按业务模块拆分
└── types.ts          # 统一响应类型定义
```

**Axios 实例配置**:
- BaseURL: `http://localhost:8000/api/v1`
- 请求拦截器: 添加 JWT Token
- 响应拦截器: 统一错误处理、401 自动跳转登录
- Timeout: 30000ms

### 2. 组件层 (`components/`)

**职责**: 可复用的 UI 组件

```
组件设计原则：
├── 原子设计: common/ > components/ > pages/
├── 受控组件: 状态由父组件传入
├── 单一职责: 每个组件只做一件事
└── 展示/容器分离: 展示组件与逻辑分离
```

**组件分类**:
- `common/`: Button, Input, Select, Modal, Table, Pagination...
- `layout/`: Header, Footer, Sider, MainLayout...
- `business/`: ProductCard, CartItem, OrderForm...

### 3. 页面层 (`pages/`)

**职责**: 路由页面组件，协调组件和数据

```
页面设计原则：
├── 路由级别代码分割
├── 获取数据逻辑放入 hooks/
├── 表单处理使用 React Hook Form
└── SEO 元信息使用 React Helmet
```

### 4. 状态层 (`stores/`)

**职责**: 全局状态管理

```
状态管理原则：
├── Zustand: 轻量级，按模块拆分 store
├── Store 不做 API 调用，只做状态同步
├── 计算属性使用 selectors
└── 持久化状态使用 zustand/persist
```

### 5. Hooks 层 (`hooks/`)

**职责**: 可复用的逻辑抽象

```
Hooks 设计原则：
├── 自定义 Hook 封装通用逻辑
├── 数据获取 Hook 返回 { data, loading, error }
├── 业务 Hook 封装 API 调用
└── useAsync 处理异步操作
```

## 开发规范

### TypeScript 规范

```typescript
// 1. 严格类型定义
interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  images: string[];
  stock: number;
  description: string;
}

// 2. 使用类型别名
type ProductList = Product[];
type ProductId = Product['id'];

// 3. API 响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 4. 组件 Props 类型
interface ProductCardProps {
  product: Product;
  onAddToCart: (id: ProductId) => void;
}
```

### 组件规范

```tsx
// 1. 函数组件 + TypeScript
import { FC } from 'react';

interface Props {
  title: string;
}

export const MyComponent: FC<Props> = ({ title }) => {
  return <div>{title}</div>;
};

// 2. 组件放在同目录
ProductCard/
├── ProductCard.tsx
├── ProductCard.less
└── index.ts
```

### API 调用规范

```typescript
// 按模块组织，一个模块一个文件
// src/api/modules/product.ts
export const productApi = {
  list: (params: ProductListParams) =>
    axios.get<ProductListResponse>('/products', { params }),

  detail: (id: string) =>
    axios.get<ProductDetailResponse>(`/products/${id}`),

  create: (data: CreateProductDTO) =>
    axios.post<ProductResponse>('/products', data),
};
```

## 开发流程

### 1. 需求分析
- 理解页面需求和 UI 设计稿
- 确定 API 接口和数据模型
- 划分组件结构

### 2. 环境搭建
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install antd @ant-design/icons axios react-router-dom zustand react-hook-form zod @hookform/resolvers recharts
```

### 3. 项目初始化
- 配置 Vite 路径别名 `@/` -> `src/`
- 配置 ESLint + Prettier
- 配置 Axios 实例
- 配置路由
- 配置 Zustand Store 骨架

### 4. 组件开发流程

```
Step 1: 创建 API 模块（如果需要后端交互）
Step 2: 创建 TypeScript 类型定义
Step 3: 创建自定义 Hook（数据获取逻辑）
Step 4: 创建 Store（如果需要全局状态）
Step 5: 开发 Common 组件
Step 6: 开发业务组件
Step 7: 组装页面组件
Step 8: 集成测试
```

### 5. 代码提交
```bash
npm run lint    # ESLint 检查
npm run format  # Prettier 格式化
npm run build   # 生产构建
```

## 核心功能模块

### 1. 商品模块
- 商品列表（分页、筛选、搜索）
- 商品详情（轮播图、SKU选择、评价）
- 商品分类

### 2. 购物车模块
- 添加/删除/修改商品数量
- 购物车列表
- 价格实时计算
- 选中状态管理

### 3. 订单模块
- 订单确认页
- 地址管理
- 订单提交
- 订单列表

### 4. 用户模块
- 登录/注册
- JWT Token 管理
- 用户信息管理
- 收货地址管理

## 代码分割策略

```typescript
// 路由级别代码分割
const Home = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));

// 组件级别分割
const ProductCard = lazy(() => import('./components/product/ProductCard'));
```

## 性能优化

- React.memo 避免不必要的重渲染
- useMemo 缓存计算结果
- useCallback 缓存回调函数
- 路由懒加载
- 图片懒加载
- Antd 组件按需引入

## 环境变量

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=电商网站
```
