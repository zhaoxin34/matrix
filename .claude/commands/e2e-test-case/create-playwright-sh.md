---
name: e2e-test-case:create-playwright-sh
allowed-tools: Read, Glob, Bash, Write
description: 通过测试用例文档生成playwright测试脚本
argument-hint: <test-case-file>
---

# E2E 测试计划生成器

根据测试用例文档生成测试计划。

## 参数

- `test-case-file`: 测试用例文档路径

## 执行步骤

1. 读取测试用例文档
2. 解析文档中的测试模块和用例
3. 使用playwright-cli skills执行测试用例
4. 将playwright-cli执行的过程生成脚本，写入文件
   输出文件的目录为`test-case-file`的目录下的playwright目录，文件名为`case-id.sh`

## 执行示例

`/e2e-test-case:create-playwright-sh ./cdp/e2e-test-case/login-e2e-test-cases.md`

step1 读取login-e2e-test-cases.yml
login-e2e-test-cases.md 示例内容如下

```markdown
## 1. module1

### case-id-001: case-name-001

- **前置条件**: condition1
- **测试步骤**：
  1. step1
  2. step2
  3. step3
- **预期结果**：
  1. result1
  2. result2

### case-id-002: case-name-002

- **前置条件**: condition2
- **测试步骤**：
  1. step1
- **预期结果**：
  1. result1

## 1. module2

### case-id-003: case-name-003

- **前置条件**: condition3
- **测试步骤**：
  1. step1
  2. step2
  3. step3
- **预期结果**：
  1. result1
  2. result2
```

step2 创建一个执行计划放到 `test-case-file`目录下，叫`test-case-file-playwright-create-plan.md`
如果create-plan.md文件已经存在了，则跳过这步，进行下一步
格式如下

```markdown
# module1

- [] caes-id-001
- [] caes-id-002

# module2

- [] caes-id-003
```

step3 遍历 `test-case-file-playwright-create-plan.md` 文件中未完成的case，使用playwright-cli进行测试，并生成脚本，放到./cdp/e2e-test-case/playwright/ 目录下

如果playwright-cli执行报错，无论是代码问题，还是测试用例本身有问题，都需要记录一下错误的原因，然后继续执行下一个用例，直至所有用例都创建过或者有错误

playwright执行错误的示例

```markdown
# module1

- [x] caes-id-001
- [] caes-id-002
  错误原因：xxxxxxxxxxxxxxxx

# module2

- [x] caes-id-003
```

上面的示例会生成如下的playwright测试脚本

- ./cdp/e2e-test-case/playwright/
  - case-id-001.sh
  - case-id-002.sh
  - case-id-002.sh
