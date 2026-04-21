---
name: e2e-test-case:create-execute
allowed-tools: Read, Glob, Bash, Write
description: 根据测试计划输出测试执行文档
argument-hint: <test-plan-file>
---

# E2E 测试执行生成器

根据测试计划文档输出 测试执行文档。

## 参数

- `test-plan-file`: 测试计划文档路径

## 输出文档位置和文件名

文件生成到`test-plan-file`同级目录，文件名用`test-plan-file`-execute.yml,比如`test-plan-file`是 login.yml, 则生成文件login-execute.yml即可

## 执行示例

用户输入:
`/e2e-test-case:create-execute ./cdp/e2e-test-case/login-e2e-test-cases.yml`

首先判断待输出的测试执行文件是否已经存在，如果存在，则读取，总结给用户看，并询问用户是否要覆盖。

如果不存在或用户打算覆盖文件，执行如下过程

读取示例文件：login-e2e-test-cases.yml

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

输出文件：login-e2e-test-cases-execute.yml

```yml
create-time: 2026-01-01 12:30
test-case-file: login-e2e-test-cases.md
status: waiting
cases:
  - id: case-001
    name: case-name-001
    module: module1
    status: waiting
  - id: case-002
    name: case-name-002
    module: module1
    status: waiting
  - id: case-003
    name: case-name-003
    module: module2
    status: waiting
```

cases.status为：

- passed - 测试通过
- failed - 测试失败
- blocked - 被阻塞
