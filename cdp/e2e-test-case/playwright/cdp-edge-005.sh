#!/bin/bash

# CDP-EDGE-005: 未登录访问受保护页面
# 测试步骤：尝试访问需要登录的页面
# 预期结果：页面重定向到登录页

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-EDGE-005 未登录访问受保护页面测试 ==="

# 1. 清除登录状态
echo "[1/5] 清除登录状态..."
playwright-cli --config "$CONFIG_PATH" delete-data
sleep 2

# 2. 打开受保护的客户列表页
echo "[2/5] 访问受保护的客户列表页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/customer
sleep 3

# 3. 获取页面快照
echo "[3/5] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 4. 检查当前URL
echo "[4/5] 检查重定向结果..."
echo "请检查页面是否已重定向到登录页: http://localhost:3001/login"

# 5. 获取最终页面状态
echo "[5/5] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否重定向到登录页"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
