---
name: e2e-test-case:create-plan
allowed-tools: Read, Glob, Bash, Write
description: 通过测试用例文档生成测试计划
argument-hint: <test-case-file>
---

# E2E 测试计划生成器

根据测试用例文档生成测试计划。

## 参数

- `test-case-file`: 测试用例文档路径

## 功能

1. 读取测试用例文档
2. 解析文档中的测试模块和用例
3. 生成测试计划，包含：
   - 测试用例 ID 和名称列表
   - 按模块分组
   - 执行顺序建议
   - 执行过程引用原测试用例文件

## 测试计划格式

```yaml
create-time: yyyy-MM-dd HH:mm
test-case-file: test-case-file
cases:
  - id: case的id
    name: case的名字
    module: case的模块名
  - id:
    name:
    module:
```

## 输出文件位置和文件名

文件生成到`test-case-file`同级目录，文件名用`test-case-file`, 只是扩展名不同即可，比如`test-case-file`是 login.md, 则生成文件login.yml即可

## 示例

`/e2e-test-case:create-plan ./cdp/e2e-test-case/login-e2e-test-cases.md`

首先判断待输出的测试执行文件是否已经存在，如果存在，则读取，总结给用户看，并询问用户是否要覆盖。

如果不存在或用户打算覆盖文件，执行如下过程

示例文件：login-e2e-test-cases.md

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

输出文件到 ./cdp/e2e-test-case/login-e2e-test-cases.yml

login-e2e-test-cases.yml

```yml
create-time: 2020-01-01 12:30
test-case-file: login-e2e-test-cases.md
cases:
  - id: case-001
    name: case-name-001
    module: module1
  - id: case-002
    name: case-name-002
    module: module1
  - id: case-003
    name: case-name-003
    module: module2
```

最后推荐用户执行创建测试执行
`/e2e-test-case:create-execute ./cdp/e2e-test-case/login-e2e-test-cases.yml`
