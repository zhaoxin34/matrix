#!/bin/bash

# CDP-REG-002: 注册表单输入验证测试用例
# 测试步骤：
#   1. 打开浏览器访问 http://localhost:3001/register
#   2. 不输入任何内容直接点击注册
#   3. 或输入格式错误的邮箱
#   4. 或输入不匹配的密码
# 预期结果：
#   1. 显示相应的验证错误提示

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-REG-002 注册表单输入验证测试 ==="

# 测试1: 不输入任何内容直接点击注册
echo -e "\n[测试1] 不输入任何内容直接点击注册..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/register
playwright-cli --config "$CONFIG_PATH" snapshot

# 点击注册按钮
echo -e "\n[点击注册按钮]..."
playwright-cli --config "$CONFIG_PATH" click e108

sleep 1
playwright-cli --config "$CONFIG_PATH" snapshot

# 测试2: 输入格式错误的邮箱
echo -e "\n[测试2] 输入格式错误的邮箱..."
playwright-cli --config "$CONFIG_PATH" reload
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名
playwright-cli --config "$CONFIG_PATH" fill e37 "testuser"
# 填写错误格式的邮箱
playwright-cli --config "$CONFIG_PATH" fill e48 "test@"
# 填写手机号
playwright-cli --config "$CONFIG_PATH" fill e59 "13900000001"
# 点击获取验证码
playwright-cli --config "$CONFIG_PATH" click e73
sleep 2
# 填写验证码
playwright-cli --config "$CONFIG_PATH" fill e71 "123456"
# 填写密码
playwright-cli --config "$CONFIG_PATH" fill e85 "abcd1234"
# 勾选服务条款
playwright-cli --config "$CONFIG_PATH" click e98
# 点击注册
playwright-cli --config "$CONFIG_PATH" click e108

sleep 1
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否显示验证错误提示"

playwright-cli --config "$CONFIG_PATH" close
