# 电商网站 E2E 测试

## 测试范围

- **登录功能** (`TC-LOGIN-*`): 用户登录验证
- **注册功能** (`TC-REGISTER-*`): 新用户注册
- **会话状态** (`TC-SESSION-*`): 登录状态持久化

## 运行测试

```bash
cd e2e-test-case/ecommerce
npx playwright test
```

## 测试账号

- 手机号: `13800138001`
- 密码: `Password123`

## 前置要求

1. 启动后端服务: `cd ecommerce/backend && PYTHONPATH=src python -m uvicorn app.main:app --port 8000`
2. 启动前端服务: `cd ecommerce/frontend && npm run dev`
