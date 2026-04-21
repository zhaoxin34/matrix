#!/bin/bash

# CDP-LOG-008: 密码可见性切换测试用例
# 测试步骤：
#   1. 在登录页输入密码
#   2. 点击密码输入框旁边的眼睛图标
# 预期结果：密码从隐藏（显示为点）变为可见，或从可见变为隐藏

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"
PASSWORD="abcd1234"

echo "=== CDP-LOG-008 密码可见性切换测试 ==="

# 打开登录页面
echo -e "\n[1/5] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/5] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写密码
echo -e "\n[3/5] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$PASSWORD"

# 获取页面状态
echo -e "\n[4/5] 获取页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 点击眼睛图标切换密码可见性
echo -e "\n[5/5] 点击眼睛图标..."
playwright-cli --config "$CONFIG_PATH" click e49

# 等待页面响应
echo -e "\n等待页面响应..."
sleep 1

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证密码是否从隐藏变为可见或从可见变为隐藏"

playwright-cli --config "$CONFIG_PATH" close
