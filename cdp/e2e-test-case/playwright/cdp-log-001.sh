#!/bin/bash

# CDP-LOG-001: 用户成功登录测试用例
# 测试步骤：
#   1. 打开浏览器访问 http://localhost:3001/login
#   2. 输入用户名和密码
#   3. 点击登录按钮
# 预期结果：
#   1. 登录成功，跳转到首页
#   2. 显示用户信息或登出按钮

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"
USERNAME="13800138002"
PASSWORD="abcd1234"

echo "=== CDP-LOG-001 用户成功登录测试 ==="

# 打开登录页面
echo -e "\n[1/5] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/5] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名/手机号
echo -e "\n[3/5] 填写用户名/手机号..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 填写密码
echo -e "\n[4/5] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$PASSWORD"

# 点击登录按钮
echo -e "\n[5/5] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59

# 等待页面跳转
echo -e "\n等待页面跳转..."
sleep 3

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证："
echo "  1. 页面是否跳转到首页"
echo "  2. 是否显示用户信息或登出按钮"

playwright-cli --config "$CONFIG_PATH" close
