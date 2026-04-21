#!/bin/bash

# CDP-CUSTOMER-001: 客户列表页正常加载
# 测试步骤：打开浏览器访问客户列表页面
# 预期结果：
#   - 页面显示客户列表
#   - 显示客户基本信息（姓名、邮箱、手机号等）
#   - 分页控件正常工作

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

# 测试用户信息
USERNAME="13800138002"
PASSWORD="abcd1234"

echo "=== CDP-CUSTOMER-001 客户列表页正常加载测试 ==="

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

# 等待登录成功
echo -e "\n[6/8] 等待登录成功..."
sleep 5

# 访问客户列表页
echo -e "\n[7/8] 访问客户列表页..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001/customer

# 等待页面加载
sleep 3

# 获取页面快照
echo -e "\n[8/8] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否包含："
echo "  - 客户列表"
echo "  - 客户基本信息（姓名、邮箱、手机号）"
echo "  - 分页控件"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
