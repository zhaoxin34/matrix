#!/bin/bash

# CDP-REG-005: 注册-用户名已存在测试用例
# 测试步骤：
#   1. 打开浏览器访问 http://localhost:3001/register
#   2. 输入已存在的用户名
#   3. 输入其他有效信息
#   4. 点击注册按钮
# 预期结果：显示错误提示，提示用户名已存在

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-REG-005 注册-用户名已存在测试 ==="
echo "使用已存在的测试用户名: 13800138002"

# 打开注册页面
echo -e "\n[1/6] 打开注册页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/register

# 获取初始快照
echo -e "\n[获取页面快照]..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写已存在的用户名
echo -e "\n[2/6] 填写已存在的用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "13800138002"

# 填写邮箱
echo -e "\n[3/6] 填写邮箱..."
playwright-cli --config "$CONFIG_PATH" fill e48 "existing@test.com"

# 填写手机号
echo -e "\n[4/6] 填写手机号..."
playwright-cli --config "$CONFIG_PATH" fill e59 "13900000002"

# 点击获取验证码
echo -e "\n[5/6] 获取验证码..."
playwright-cli --config "$CONFIG_PATH" click e73

sleep 2
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写验证码
playwright-cli --config "$CONFIG_PATH" fill e71 "123456"

# 填写密码
playwright-cli --config "$CONFIG_PATH" fill e85 "abcd1234"

# 勾选服务条款
playwright-cli --config "$CONFIG_PATH" click e98

# 点击注册按钮
echo -e "\n[6/6] 点击注册按钮..."
playwright-cli --config "$CONFIG_PATH" click e108

# 等待并获取最终页面状态
sleep 2
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否显示'用户名已存在'的错误提示"

playwright-cli --config "$CONFIG_PATH" close
