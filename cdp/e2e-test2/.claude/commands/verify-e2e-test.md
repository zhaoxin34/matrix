---
name: verify-e2e-test
allowed-tools: Read, Glob, Bash, Write
description: 根据e2e编写规范校验和修改代码
---

# 执行流程

step1: 读取e2e编写规范
@../rules/e2e-rules.md

step2: 使用`git add -n .|grep -e '.*/test_.*\.py$'`找到test_xxx.py，如果该文件是e2e的测试用例，那么根据e2e-rules.md的规范校验，并修改代码，修改后，给出修改总结。
