#!/bin/bash

# CDP-REG-007: 注册-密码太短测试用例
# 测试步骤：
#   1. 打开浏览器访问 http://localhost:3001/register
#   2. 输入有效的用户名和邮箱
#   3. 输入过短的密码（如"123"）
#   4. 输入正确的确认密码
#   5. 点击注册按钮
# 预期结果：显示错误提示，提示密码长度不足

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

TIMESTAMP=$(date +%Y%m%d%H%M%S)
USERNAME="testuser${TIMESTAMP}"
EMAIL="${USERNAME}@example.com"

echo "=== CDP-REG-007 注册-密码太短测试 ==="
echo "用户名: $USERNAME"
echo "邮箱: $EMAIL"
echo "测试密码: 123 (过短)"

# 打开注册页面
echo -e "\n[1/8] 打开注册页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/register

# 获取初始快照
echo -e "\n[获取页面快照]..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名
echo -e "\n[2/8] 填写用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 填写邮箱
echo -e "\n[3/8] 填写邮箱..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$EMAIL"

# 填写手机号
echo -e "\n[4/8] 填写手机号..."
playwright-cli --config "$CONFIG_PATH" fill e59 "13900000004"

# 点击获取验证码
echo -e "\n[5/8] 获取验证码..."
playwright-cli --config "$CONFIG_PATH" click e73

sleep 2
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写验证码
playwright-cli --config "$CONFIG_PATH" fill e71 "123456"

# 填写过短的密码
echo -e "\n[6/8] 填写过短的密码..."
playwright-cli --config "$CONFIG_PATH" fill e85 "123"

# 勾选服务条款
echo -e "\n[7/8] 勾选服务条款..."
playwright-cli --config "$CONFIG_PATH" click e98

# 点击注册按钮
echo -e "\n[8/8] 点击注册按钮..."
playwright-cli --config "$CONFIG_PATH" click e108

# 等待并获取最终页面状态
sleep 2
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否显示'密码长度不足'的错误提示"

playwright-cli --config "$CONFIG_PATH" close
