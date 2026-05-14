---
name: neo-dev
description: 产品设计 → 技术设计 → 审核 → UI开发 → 测试验证的完整流程
---

## prd-manager

output: .pi/outputs/prd-output.md
inheritProjectContext: true

修改产品文档以更新 workspace 路由设计。任务：{task}

## tech-manager

output: .pi/outputs/tech-output.md
inheritProjectContext: true

修改技术文档以更新 workspace 路由实现方案。任务：{task}

## doc-reviewer

output: .pi/outputs/doc-review.md
reads: .pi/outputs/prd-output.md+.pi/outputs/tech-output.md
progress: true

审核产品文档(.pi/outputs/prd-output.md)和技术文档(.pi/outputs/tech-output.md)，给出明确的问题列表和改进建议。

## oracle

output: .pi/outputs/doc-decision.md
reads: .pi/outputs/doc-review.md
thinking: high

根据审核结果(.pi/outputs/doc-review.md)判断是否通过。如果通过返回 PASS 并说明可以进入 UI 阶段；如果有问题返回 NEED_FIX 并指明谁需要修复什么问题。

## planner

reads: .pi/outputs/doc-decision.md
output: .pi/outputs/ui-plan.md

根据 oracle 的 .pi/outputs/doc-decision.md 决定下一步：

- 如果是 PASS：分配给 ui-developer 开始 UI 开发
- 如果是 NEED_FIX：根据问题类型分配给 prd-manager 或 tech-manager 修复

## ui-developer

output: .pi/outputs/ui-code.md
inheritProjectContext: true
progress: true

根据设计文档和 ui-plan.md 修改 UI 代码。任务：{previous}

## ui-tester

output: .pi/outputs/ui-test-report.md
reads: .pi/outputs/ui-code.md
progress: true

测试 UI 修改，生成详细的测试报告。

## oracle-test

reads: .pi/outputs/ui-test-report.md
thinking: high

根据测试报告判断：

- 如果通过（PASS）：可以进入最终报告阶段
- 如果有问题（NEED_FIX）：返回给 ui-developer 继续修复

## final-reporter

output: .pi/outputs/final-report.md
reads: .pi/outputs/prd-output.md+.pi/outputs/tech-output.md+.pi/outputs/doc-review.md+.pi/outputs/ui-code.md+.pi/outputs/ui-test-report.md

生成最终的验证报告，总结整个设计-开发-测试流程的结果。
