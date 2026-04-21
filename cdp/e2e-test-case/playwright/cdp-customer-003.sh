#!/bin/bash

# CDP-CUSTOMER-003: 客户详情查看
# 测试步骤：在客户列表页点击某个客户
# 预期结果：页面显示该客户的详细信息

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

# 测试用户信息
USERNAME="13800138002"
PASSWORD="abcd1234"

echo "=== CDP-CUSTOMER-003 客户详情查看测试 ==="

# 1. 打开浏览器并访问登录页
echo "[1/7] 打开登录页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login
sleep 3

# 2. 获取登录页快照
echo "[2/7] 获取登录页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 3. 填写用户名
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

# 点击第一个客户行
echo "点击客户查看详情..."
playwright-cli --config "$CONFIG_PATH" click e57
sleep 3

# 获取详情页快照
echo "获取客户详情页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否显示客户的详细信息"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
