#!/bin/bash

# CDP-CUSTOMER-002: 客户列表搜索功能
# 测试步骤：
#   1. 在客户列表页的搜索框输入关键词
#   2. 点击搜索按钮或按回车
# 预期结果：客户列表更新，仅显示匹配搜索条件的客户

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

# 测试用户信息
USERNAME="13800138002"
PASSWORD="abcd1234"
SEARCH_KEYWORD="test"

echo "=== CDP-CUSTOMER-002 客户列表搜索功能测试 ==="

# 1. 打开浏览器并访问登录页
echo "[1/7] 打开登录页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login
sleep 3

# 2. 获取登录页快照，找到输入框
echo "[2/7] 获取登录页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 3. 填写用户名 - 使用fill命令
echo "[3/7] 填写用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$USERNAME"

# 4. 填写密码
echo "[4/7] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$PASSWORD"

# 5. 点击登录按钮
echo "[5/7] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59
sleep 5

# 6. 导航到客户列表页
echo "[6/7] 导航到客户列表页..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001/customer
sleep 3

# 7. 获取客户列表页快照
echo "[7/7] 获取客户列表页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 在客户列表页进行搜索
echo "执行搜索..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$SEARCH_KEYWORD"
sleep 1
playwright-cli --config "$CONFIG_PATH" press Enter
sleep 3

# 获取搜索结果快照
echo "获取搜索结果..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查客户列表是否已更新为匹配搜索条件 '$SEARCH_KEYWORD' 的结果"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
