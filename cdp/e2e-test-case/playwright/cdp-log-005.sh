#!/bin/bash

# CDP-LOG-005: 登录输入框验证-用户名为空测试用例
# 测试步骤：
#   1. 保持用户名输入框为空
#   2. 输入密码
#   3. 点击登录按钮
# 预期结果：显示验证错误提示，用户名输入框显示错误状态

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"
PASSWORD="abcd1234"

echo "=== CDP-LOG-005 登录输入框验证-用户名为空测试 ==="

# 打开登录页面
echo -e "\n[1/4] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/4] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写密码（保持用户名为空）
echo -e "\n[3/4] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$PASSWORD"

# 点击登录按钮
echo -e "\n[4/4] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59

# 等待页面响应
echo -e "\n等待页面响应..."
sleep 2

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证："
echo "  1. 是否显示验证错误提示"
echo "  2. 手机号输入框是否显示错误状态"

playwright-cli --config "$CONFIG_PATH" close
