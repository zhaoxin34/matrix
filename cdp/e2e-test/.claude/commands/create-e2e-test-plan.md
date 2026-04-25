---
name: create-e2e-test-plan
allowed-tools: Read, Glob, Bash, Write
description: 根据test-case-file, 创建e2e测试计划
argument-hint: <test-case-file>
---

# E2E 测试计划生成器

根据测试用例文档生成测试计划。

## 参数

- `test-case-file`: 测试用例文档路径

## 示例

`/create-e2e-test test-case-file.md`

如果`test-case-file`不存在, 提示用户后，退出。

step1: 读取test-case-file.md
示例文件：test-case-file.md

```markdown
## 1. module1

### case-001: case-name-001

- **前置条件**: condition1
- **测试步骤**：
  1. step1
  2. step2
  3. step3
- **预期结果**：
  1. result1
  2. result2

### case-002: case-name-002

- **前置条件**: condition2
- **测试步骤**：
  1. step1
- **预期结果**：
  1. result1

## 1. module2

### case-003: case-name-003

- **前置条件**: condition3
- **测试步骤**：
  1. step1
  2. step2
  3. step3
- **预期结果**：
  1. result1
  2. result2
```

step2: 创建一个执行计划放到 `test-case-file`目录下，叫`test-case-file-plan.md`
如果test-case-plan.md文件已经存在了，则跳过这步，进行下一步
格式如下

```markdown
# 用例计划信息

- 用例文档：`test-case-file.md`
- 创建时间：yyyy-MM-dd HH:mm
- 模块数量：x
- 用例数量：x

# module1

## caes-id-001

- [ ] playwright-cli 对齐产品
- [ ] 编写测试用例
- [ ] 验证测试用例是否符合规范
- [ ] 执行并修改测试用例

状态：待执行
失败原因：

## caes-id-002

... 同 case-id-001

# module2

## caes-id-003

... 同 case-id-001
```

step3: 提示用户使用 /create-e2e-test-code.md `test-case-file-plan.md` 创建测试用例代码
