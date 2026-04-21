#!/bin/bash

# CDP-REG-001: 用户成功注册测试用例
# 测试步骤：
#   1. 打开浏览器访问 http://localhost:3001/register
#   2. 输入用户名、密码、确认密码、邮箱
#   3. 点击注册按钮
# 预期结果：
#   1. 注册成功，跳转到登录页面或显示成功消息
#   2. 可以使用注册的账号登录

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

# 生成唯一的测试数据
TIMESTAMP=$(date +%Y%m%d%H%M%S)
USERNAME="newuser${TIMESTAMP}"
EMAIL="${USERNAME}@example.com"
PHONE="130123$(date +%H%M%S)"
PASSWORD="abcd1234"

echo "=== CDP-REG-001 用户成功注册测试 ==="
echo "用户名: $USERNAME"
echo "邮箱: $EMAIL"
echo "手机号: $PHONE"

# 打开注册页面
echo -e "\n[1/9] 打开注册页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/register

# 获取初始快照以确认页面元素
echo -e "\n[获取页面快照]..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名
echo -e "\n[2/9] 填写用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 填写邮箱
echo -e "\n[3/9] 填写邮箱..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$EMAIL"

# 填写手机号
echo -e "\n[4/9] 填写手机号..."
playwright-cli --config "$CONFIG_PATH" fill e59 "$PHONE"

# 点击获取验证码按钮
echo -e "\n[5/9] 获取验证码..."
playwright-cli --config "$CONFIG_PATH" click e73

# 等待验证码输入框可用并获取最新快照
echo -e "\n[6/9] 等待并获取最新页面状态..."
sleep 3
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写验证码（需要手动从短信获取，这里用测试验证码123456）
echo -e "\n[7/9] 填写验证码..."
playwright-cli --config "$CONFIG_PATH" fill e71 "123456"

# 填写密码
echo -e "\n[8/9] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e85 "$PASSWORD"

# 勾选服务条款
echo -e "\n[9/9] 勾选服务条款..."
playwright-cli --config "$CONFIG_PATH" click e98

# 点击注册按钮
echo -e "\n[提交注册]..."
playwright-cli --config "$CONFIG_PATH" click e108

# 等待页面跳转
sleep 3

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 输出测试结果
echo -e "\n=== 测试完成 ==="
echo "测试数据已记录："
echo "  用户名: $USERNAME"
echo "  邮箱: $EMAIL"
echo "  手机号: $PHONE"
echo "  密码: $PASSWORD"
echo ""
echo "请检查最终页面是否显示注册成功并跳转到首页"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
