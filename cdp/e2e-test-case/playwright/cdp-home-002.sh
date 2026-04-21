#!/bin/bash

# CDP-HOME-002: 首页导航到登录页
# 测试步骤：在首页点击"登录"链接
# 预期结果：页面跳转到登录页 http://localhost:3001/login

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-HOME-002 首页导航到登录页测试 ==="

# 打开首页
echo -e "\n[1/4] 打开首页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001

# 等待页面加载
sleep 3

# 获取页面快照
echo -e "\n[2/4] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 点击登录链接（e9是登录链接）
echo -e "\n[3/4] 点击登录链接..."
playwright-cli --config "$CONFIG_PATH" click e9

# 等待页面跳转
sleep 3

# 获取页面快照验证跳转
echo -e "\n[4/4] 获取页面快照验证..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否已跳转到登录页: http://localhost:3001/login"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
