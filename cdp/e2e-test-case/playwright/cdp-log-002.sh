#!/bin/bash

# CDP-LOG-002: 错误密码登录失败测试用例
# 测试步骤：
#   1. 打开浏览器访问 http://localhost:3001/login
#   2. 输入正确的用户名和错误的密码
#   3. 点击登录按钮
# 预期结果：
#   1. 登录失败
#   2. 显示错误提示信息

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"
USERNAME="13800138002"
WRONG_PASSWORD="wrongpassword123"

echo "=== CDP-LOG-002 错误密码登录失败测试 ==="

# 打开登录页面
echo -e "\n[1/5] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/5] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名
echo -e "\n[3/5] 填写用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 填写错误密码
echo -e "\n[4/5] 填写错误密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$WRONG_PASSWORD"

# 点击登录按钮
echo -e "\n[5/5] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59

# 等待页面响应
echo -e "\n等待页面响应..."
sleep 2

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证："
echo "  1. 是否显示错误提示信息"
echo "  2. 是否仍停留在登录页"

playwright-cli --config "$CONFIG_PATH" close
