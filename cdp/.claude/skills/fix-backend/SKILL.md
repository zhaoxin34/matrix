---
name: fix-backend
description: 当用户希望修复cdp的backend的错误时调用。
---

# 执行流程

step1：问题分析

查看后端日志分析问题

示例命令

```bash
tail -n 100 $PROJECT_DIR/logs/cdp-backend.log

```

`PROJECT_DIR` 是cdp项目的地址

step2：重现问题

根据日志，试试能不能重现这个问题，一般重现的问题，更好确认问题，如果不能重现，就只能通过经验分析了。

step3: 解决问题

分析问题的原因修改代码

step4: 验证问题

通过curl或playwright-cli验证问题是否 被解决，如果没解决，重复step1-4
