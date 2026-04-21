#!/bin/bash

# CDP-REG-006: 注册-邮箱格式错误测试用例
# 测试步骤：
#   1. 打开浏览器访问 http://localhost:3001/register
#   2. 输入有效的用户名
#   3. 输入格式错误的邮箱（如"test@"或"test.com"）
#   4. 输入符合要求的密码和确认密码
#   5. 点击注册按钮
# 预期结果：显示错误提示，提示邮箱格式不正确

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

TIMESTAMP=$(date +%Y%m%d%H%M%S)
USERNAME="testuser${TIMESTAMP}"

echo "=== CDP-REG-006 注册-邮箱格式错误测试 ==="
echo "用户名: $USERNAME"
echo "测试邮箱格式: test@ (错误格式)"

# 打开注册页面
echo -e "\n[1/7] 打开注册页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/register

# 获取初始快照
echo -e "\n[获取页面快照]..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名
echo -e "\n[2/7] 填写用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 填写错误格式的邮箱
echo -e "\n[3/7] 填写格式错误的邮箱..."
playwright-cli --config "$CONFIG_PATH" fill e48 "test@"

# 填写手机号
echo -e "\n[4/7] 填写手机号..."
playwright-cli --config "$CONFIG_PATH" fill e59 "13900000003"

# 点击获取验证码
echo -e "\n[5/7] 获取验证码..."
playwright-cli --config "$CONFIG_PATH" click e73

sleep 2
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写验证码
playwright-cli --config "$CONFIG_PATH" fill e71 "123456"

# 填写密码
echo -e "\n[6/7] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e85 "abcd1234"

# 勾选服务条款
playwright-cli --config "$CONFIG_PATH" click e98

# 点击注册按钮
echo -e "\n[7/7] 点击注册按钮..."
playwright-cli --config "$CONFIG_PATH" click e108

# 等待并获取最终页面状态
sleep 2
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否显示'邮箱格式不正确'的错误提示"

playwright-cli --config "$CONFIG_PATH" close
