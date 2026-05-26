# Neo E2E Test

E2E 自动化测试框架，使用 Playwright + pytest。

## 安装

```bash
make install
```

## 运行测试

```bash
# 运行所有测试
make test

# 运行 smoke 测试
make test-smoke

# 运行带界面测试
make dev
```

## 生成报告

```bash
make report
make open-report
```