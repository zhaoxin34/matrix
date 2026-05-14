---
name: neo-ui
description: 从产品设计文档到 UI 实现的完整流程：开发 → 测试 → 迭代
---

## ui-developer

skills: frontend-design
progress: true

你是 UI 开发专家。根据产品设计文档 {task}，在 `/Volumes/data/working/ai/matrix/neo/ui/` 目录下开发对应的 UI 代码。

## ui-tester

skills: agent-browser
progress: true

你是 UI 测试专家。根据同一份产品设计文档，验证 UI 实现是否正确。使用 agent-browser 打开 http://localhost:3300 进行浏览器测试，生成详细的测试报告。

如果测试通过，流程结束。
如果测试失败，将失败项汇总并返回给 neo.ui-developer 进行修复。

## ui-developer

reads: .pi/outputs/ui-test-\*.md
skills: frontend-design
progress: true

根据测试报告中的失败项，修复 UI 代码。完成后报告修复结果。

## ui-tester

skills: agent-browser
progress: true

重新测试修复后的页面。如果仍有问题，继续修复循环。如果通过，输出最终报告。
