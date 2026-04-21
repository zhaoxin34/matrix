#!/bin/bash

# CDP-LOG-009: 已登录状态访问登录页测试用例
# 前置条件：用户已登录
# 测试步骤：在已登录状态下访问 http://localhost:3001/login
# 预期结果：重定向到首页或用户中心（已登录用户不能访问登录页）

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"
USERNAME="13800138002"
PASSWORD="abcd1234"

echo "=== CDP-LOG-009 已登录状态访问登录页测试 ==="

# 打开登录页面并登录
echo -e "\n[1/7] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/7] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名
echo -e "\n[3/7] 填写用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 填写密码
echo -e "\n[4/7] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$PASSWORD"

# 点击登录按钮
echo -e "\n[5/7] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59

# 等待登录完成
echo -e "\n等待登录..."
sleep 3

# 获取登录后的页面状态
echo -e "\n[6/7] 获取登录后页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 再次访问登录页
echo -e "\n[7/7] 再次访问登录页..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001/login

# 等待页面响应
echo -e "\n等待页面响应..."
sleep 2

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证："
echo "  1. 是否重定向到首页或用户中心"
echo "  2. 已登录用户不能访问登录页"

playwright-cli --config "$CONFIG_PATH" close
