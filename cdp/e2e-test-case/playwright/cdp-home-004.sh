#!/bin/bash

# CDP-HOME-004: 已登录用户显示用户信息
# 测试步骤：打开浏览器访问 http://localhost:3001
# 预期结果：
#   - 导航栏显示用户名或用户头像
#   - 显示"登出"或"退出"按钮

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

# 测试用户信息
USERNAME="13800138002"
PASSWORD="abcd1234"

echo "=== CDP-HOME-004 已登录用户显示用户信息测试 ==="

# 打开登录页
echo -e "\n[1/8] 打开登录页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 等待页面加载
sleep 3

# 获取页面快照
echo -e "\n[2/8] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写用户名
echo -e "\n[3/8] 填写用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 填写密码
echo -e "\n[4/8] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$PASSWORD"

# 点击登录按钮
echo -e "\n[5/8] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59

# 等待登录成功和页面跳转
echo -e "\n[6/8] 等待登录成功..."
sleep 5

# 获取页面快照验证登录后状态
echo -e "\n[7/8] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n[8/8] 检查用户信息显示..."
echo "请检查页面是否显示："
echo "  - 用户名或用户头像"
echo "  - 登出或退出按钮"

echo -e "\n=== 测试完成 ==="

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
