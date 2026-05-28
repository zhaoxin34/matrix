## 1. 状态流转数据与逻辑

- [ ] 1.1 添加 transitionMap 状态流转映射配置
- [ ] 1.2 实现 handleTransition 状态更新函数
- [ ] 1.3 添加 getStatusLabel 状态标签转换函数

## 2. UI 组件集成

- [ ] 2.1 在操作列将现有按钮替换为 Dropdown Menu
- [ ] 2.2 根据当前员工状态动态渲染可用的操作选项
- [ ] 2.3 保留现有的编辑和删除按钮

## 3. Toast 提示

- [ ] 3.1 检查项目是否已有 toast 库（sonner）
- [ ] 3.2 如无 toast 库，添加 sonner 依赖
- [ ] 3.3 在 handleTransition 成功后显示成功提示

## 4. 测试验证

- [ ] 4.1 验证 onboarding → on_job 流转
- [ ] 4.2 验证 on_job → transferring 流转
- [ ] 4.3 验证 on_job → offboarding 流转
- [ ] 4.4 验证 transferring → on_job 流转
- [ ] 4.5 验证 transferring → on_job (取消调动) 流转
- [ ] 4.6 验证 offboarding → onboarding 流转